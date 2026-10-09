/**
 * Server-only CRUD for the import_connections table (OAuth tokens / API
 * keys for API-based imports). The table has RLS enabled with no public
 * policies, so every access here uses the service-role client. Callers are
 * responsible for auth checks (requireCompany + isStaff) before calling.
 * Plaintext secrets never leave this module's callers in server code.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { decryptToken, encryptToken } from "@/lib/import/encryption";

export type DbProvider = "jobber" | "housecallpro" | "google_calendar";

export type ImportConnection = {
  id: string;
  company_id: string;
  provider: DbProvider;
  access_token_enc: string | null;
  refresh_token_enc: string | null;
  expires_at: string | null;
  meta: Record<string, unknown>;
};

type TokenInput = {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
  meta?: Record<string, unknown>;
};

function toRow(r: Record<string, unknown>): ImportConnection {
  return {
    id: r.id as string,
    company_id: r.company_id as string,
    provider: r.provider as DbProvider,
    access_token_enc: (r.access_token_enc as string | null) ?? null,
    refresh_token_enc: (r.refresh_token_enc as string | null) ?? null,
    expires_at: (r.expires_at as string | null) ?? null,
    meta: (r.meta as Record<string, unknown>) ?? {},
  };
}

export async function getImportConnection(
  companyId: string,
  provider: DbProvider,
): Promise<ImportConnection | null> {
  const svc = await createServiceClient();
  const { data, error } = await svc
    .from("import_connections")
    .select("*")
    .eq("company_id", companyId)
    .eq("provider", provider)
    .maybeSingle();
  if (error || !data) return null;
  return toRow(data as Record<string, unknown>);
}

export async function listImportConnections(
  companyId: string,
): Promise<ImportConnection[]> {
  const svc = await createServiceClient();
  const { data } = await svc
    .from("import_connections")
    .select("*")
    .eq("company_id", companyId);
  return ((data ?? []) as Record<string, unknown>[]).map(toRow);
}

export async function upsertImportConnection(
  companyId: string,
  provider: DbProvider,
  tokens: TokenInput,
): Promise<void> {
  const svc = await createServiceClient();
  const { error } = await svc.from("import_connections").upsert(
    {
      company_id: companyId,
      provider,
      access_token_enc: encryptToken(tokens.accessToken),
      refresh_token_enc: tokens.refreshToken
        ? encryptToken(tokens.refreshToken)
        : null,
      expires_at: tokens.expiresAt ?? null,
      meta: tokens.meta ?? {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id,provider" },
  );
  if (error) throw new Error(`Could not save the ${provider} connection.`);
}

export async function deleteImportConnection(
  companyId: string,
  provider: DbProvider,
): Promise<void> {
  const svc = await createServiceClient();
  const { error } = await svc
    .from("import_connections")
    .delete()
    .eq("company_id", companyId)
    .eq("provider", provider);
  if (error) throw new Error(`Could not remove the ${provider} connection.`);
}

export function decryptAccessToken(conn: ImportConnection): string {
  if (!conn.access_token_enc) throw new Error("Connection has no access token.");
  return decryptToken(conn.access_token_enc);
}

export function decryptRefreshToken(conn: ImportConnection): string | null {
  if (!conn.refresh_token_enc) return null;
  return decryptToken(conn.refresh_token_enc);
}

/** True when the stored access token is expired or expires within the next minute. */
export function isTokenExpired(conn: ImportConnection): boolean {
  if (!conn.expires_at) return false;
  return new Date(conn.expires_at).getTime() - Date.now() < 60_000;
}
