/**
 * Token lifecycle for QuickBooks connections.
 *
 * - Access tokens live 60 minutes; refresh tokens live 100 days and ROTATE:
 *   every refresh returns a new refresh token and the old one stops working.
 * - `getQboClient` refreshes proactively (5-minute skew) and stores BOTH new
 *   tokens before returning. The UPDATE is guarded on the old encrypted
 *   refresh token so two concurrent refreshes can't clobber each other.
 * - A failed refresh with invalid_grant marks the connection `expired`; the
 *   Settings UI then prompts the owner to reconnect (one click, once OAuth
 *   exists).
 */
import { createServiceClient } from "@/lib/supabase/server";
import { decryptToken, encryptToken } from "./crypto";
import { QboClient, QboError } from "./client";
import { QBO_TOKEN_URL, isQuickBooksConfigured } from "./config";

export type QboConnection = {
  id: string;
  company_id: string;
  realm_id: string;
  company_name: string | null;
  status: string;
  last_sync_at: string | null;
  qbo_item_id: string | null;
};

const REFRESH_SKEW_MS = 5 * 60 * 1000;

export async function getConnectionRow(companyId: string): Promise<{
  row: QboConnection & {
    access_token_enc: string;
    refresh_token_enc: string;
    token_expires_at: string;
    qbo_item_id: string | null;
  };
} | null> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("quickbooks_connections")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();
  if (error || !data) return null;
  return { row: data };
}

async function refreshTokens(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  companyId: string,
  oldRefreshEnc: string,
): Promise<{ accessToken: string; expiresAt: string } | null> {
  const refreshToken = decryptToken(oldRefreshEnc);
  const basic = Buffer.from(
    `${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!res.ok) {
    let code: string | undefined;
    try {
      code = ((await res.json()) as { error?: string }).error;
    } catch {
      /* ignore */
    }
    if (code === "invalid_grant") {
      await supabase
        .from("quickbooks_connections")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("company_id", companyId);
    }
    return null;
  }

  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  const expiresAt = new Date(Date.now() + json.expires_in * 1000).toISOString();

  // Single-writer: only store if nobody else refreshed first.
  const { data } = await supabase
    .from("quickbooks_connections")
    .update({
      access_token_enc: encryptToken(json.access_token),
      refresh_token_enc: encryptToken(json.refresh_token),
      token_expires_at: expiresAt,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", companyId)
    .eq("refresh_token_enc", oldRefreshEnc)
    .select("id")
    .maybeSingle();

  if (!data) {
    // Lost the race — re-read the winner's tokens.
    return null;
  }
  return { accessToken: json.access_token, expiresAt };
}

/**
 * Returns an authenticated QboClient for the company, or null when there is
 * no usable connection (not configured, not connected, or refresh failed).
 */
export async function getQboClient(companyId: string): Promise<{
  client: QboClient;
  connection: QboConnection;
} | null> {
  if (!isQuickBooksConfigured()) return null;
  const found = await getConnectionRow(companyId);
  if (!found || found.row.status !== "active") return null;

  const supabase = await createServiceClient();
  const { row } = found;
  const expiresAt = new Date(row.token_expires_at).getTime();

  let accessToken = decryptToken(row.access_token_enc);
  if (expiresAt - Date.now() < REFRESH_SKEW_MS) {
    const refreshed = await refreshTokens(supabase, companyId, row.refresh_token_enc);
    if (refreshed) {
      accessToken = refreshed.accessToken;
    } else {
      // Either lost the race or refresh failed. Re-read; if another worker
      // won, its tokens are now current.
      const reread = await getConnectionRow(companyId);
      if (!reread || reread.row.status !== "active") return null;
      const r = reread.row;
      if (new Date(r.token_expires_at).getTime() - Date.now() < REFRESH_SKEW_MS) {
        return null; // Genuine refresh failure.
      }
      accessToken = decryptToken(r.access_token_enc);
      return {
        client: new QboClient(r.realm_id, accessToken),
        connection: r,
      };
    }
  }

  return {
    client: new QboClient(row.realm_id, accessToken),
    connection: row,
  };
}

export function isQboAuthError(err: unknown): boolean {
  return err instanceof QboError && (err.status === 401 || err.status === 403);
}
