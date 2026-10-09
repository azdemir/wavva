"use server";

import { getTranslations } from "next-intl/server";
import { requireCompany } from "@/lib/auth";
import { isStaff, NOT_PERMITTED } from "@/lib/permissions";
import type { MappedRow } from "@/lib/import/validate";
import {
  decryptAccessToken,
  decryptRefreshToken,
  deleteImportConnection,
  getImportConnection,
  isTokenExpired,
  listImportConnections,
  upsertImportConnection,
  type DbProvider,
  type ImportConnection,
} from "@/lib/import/connections";
import {
  API_TO_DB_PROVIDER,
  type ApiProviderKey,
  type TokenSet,
} from "@/lib/import/providers/types";
import {
  fetchJobberRows,
  isJobberConfigured,
  refreshJobberToken,
} from "@/lib/import/providers/jobber";
import {
  fetchHousecallRows,
  isHousecallConfigured,
  verifyHousecallKey,
} from "@/lib/import/providers/housecallpro";
import {
  fetchGoogleRows,
  isGoogleConfigured,
  refreshGoogleToken,
} from "@/lib/import/providers/google";

export type ApiProviderStatus = {
  key: ApiProviderKey;
  configured: boolean;
  connected: boolean;
  accountName: string | null;
};

export type ApiStatusResult = {
  error?: string;
  statuses?: ApiProviderStatus[];
};

export type FetchRowsResult = {
  error?: string;
  rows?: MappedRow[];
};

const CONFIGURED: Record<ApiProviderKey, () => boolean> = {
  jobber: isJobberConfigured,
  housecallpro: isHousecallConfigured,
  google: isGoogleConfigured,
};

async function requireStaff() {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) throw new Error(NOT_PERMITTED);
  return ctx;
}

/**
 * Per-provider status for the import source step: whether the platform is
 * set up, and whether this company has connected it.
 */
export async function getApiImportStatus(): Promise<ApiStatusResult> {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };

  const connections = await listImportConnections(ctx.company.id);
  const byProvider = new Map<DbProvider, ImportConnection>(
    connections.map((c) => [c.provider, c]),
  );
  const keys: ApiProviderKey[] = ["jobber", "housecallpro", "google"];
  return {
    statuses: keys.map((key) => {
      const conn = byProvider.get(API_TO_DB_PROVIDER[key]);
      const meta = (conn?.meta ?? {}) as Record<string, unknown>;
      const accountName =
        typeof meta.account_name === "string" ? meta.account_name : null;
      return {
        key,
        configured: CONFIGURED[key](),
        connected: !!conn,
        accountName,
      };
    }),
  };
}

/** Refresh an expired OAuth token, persisting the new set. Returns null on failure. */
async function tryRefresh(
  companyId: string,
  conn: ImportConnection,
): Promise<ImportConnection | null> {
  const refreshToken = decryptRefreshToken(conn);
  if (!refreshToken) return null;
  let fresh: TokenSet | null = null;
  try {
    if (conn.provider === "jobber") fresh = await refreshJobberToken(refreshToken);
    else if (conn.provider === "google_calendar") {
      fresh = await refreshGoogleToken(refreshToken);
    } else return null; // API-key providers don't refresh
  } catch {
    return null;
  }
  if (!fresh) return null;
  await upsertImportConnection(companyId, conn.provider, {
    accessToken: fresh.accessToken,
    refreshToken: fresh.refreshToken ?? refreshToken, // keep old if not rotated
    expiresAt: fresh.expiresAt ?? null,
    meta: conn.meta,
  });
  return getImportConnection(companyId, conn.provider);
}

/** Load a working access token, refreshing OAuth tokens when expired. */
async function getWorkingToken(
  companyId: string,
  provider: DbProvider,
): Promise<{ token: string } | { error: string }> {
  let conn = await getImportConnection(companyId, provider);
  if (!conn) return { error: "notConnected" };
  try {
    if (isTokenExpired(conn)) {
      const refreshed = await tryRefresh(companyId, conn);
      if (!refreshed) return { error: "tokenExpired" };
      conn = refreshed;
    }
    return { token: decryptAccessToken(conn) };
  } catch {
    return { error: "tokenInvalid" };
  }
}

async function fetchRowsWithToken(
  key: ApiProviderKey,
  token: string,
): Promise<FetchRowsResult> {
  if (key === "jobber") return fetchJobberRows(token);
  if (key === "housecallpro") return fetchHousecallRows(token);
  return fetchGoogleRows(token);
}

/**
 * Pull records from a connected provider and normalize them to MappedRow.
 * Rows go through the SAME preview/duplicates/commit steps as CSV imports.
 */
export async function fetchImportProviderRows(
  providerKey: ApiProviderKey,
): Promise<FetchRowsResult> {
  const t = await getTranslations("import");
  let ctx;
  try {
    ctx = await requireStaff();
  } catch {
    return { error: t("api.errors.notPermitted") };
  }

  if (!CONFIGURED[providerKey]()) {
    return { error: t("api.errors.notConfigured") };
  }
  const dbProvider = API_TO_DB_PROVIDER[providerKey];

  const attempt = async (): Promise<FetchRowsResult> => {
    const tokenRes = await getWorkingToken(ctx.company.id, dbProvider);
    if ("error" in tokenRes) return { error: t(`api.errors.${tokenRes.error}`) };
    return fetchRowsWithToken(providerKey, tokenRes.token);
  };

  let result = await attempt();
  // One retry after a forced refresh when the provider rejected the token.
  if (result.error === "unauthorized") {
    const conn = await getImportConnection(ctx.company.id, dbProvider);
    if (conn) {
      const refreshed = await tryRefresh(ctx.company.id, conn);
      if (refreshed) {
        result = await fetchRowsWithToken(
          providerKey,
          decryptAccessToken(refreshed),
        );
      }
    }
  }
  if (result.error) {
    const code = ["notConnected", "tokenExpired", "tokenInvalid", "unauthorized"].includes(
      result.error,
    )
      ? result.error
      : null;
    return {
      error: code
        ? t(`api.errors.${code}`)
        : t("api.errors.fetchFailed", { detail: result.error }),
    };
  }
  return { rows: result.rows ?? [] };
}

/**
 * Save a Housecall Pro API key (encrypted at rest). The key is verified
 * against Housecall Pro before storing; bad keys are rejected.
 */
export async function saveHousecallKey(
  key: unknown,
): Promise<{ ok?: boolean; error?: string }> {
  const t = await getTranslations("import");
  let ctx;
  try {
    ctx = await requireStaff();
  } catch {
    return { error: t("api.errors.notPermitted") };
  }
  const apiKey = typeof key === "string" ? key.trim() : "";
  if (!apiKey || apiKey.length < 8 || apiKey.length > 500) {
    return { error: t("api.errors.invalidKey") };
  }
  const valid = await verifyHousecallKey(apiKey);
  if (!valid) return { error: t("api.errors.invalidKey") };
  try {
    await upsertImportConnection(ctx.company.id, "housecallpro", {
      accessToken: apiKey,
      meta: {},
    });
    return { ok: true };
  } catch {
    return { error: t("api.errors.saveFailed") };
  }
}

/** Revoke a provider connection (deletes stored tokens). */
export async function disconnectImportProvider(
  providerKey: ApiProviderKey,
): Promise<{ ok?: boolean; error?: string }> {
  const t = await getTranslations("import");
  let ctx;
  try {
    ctx = await requireStaff();
  } catch {
    return { error: t("api.errors.notPermitted") };
  }
  try {
    await deleteImportConnection(ctx.company.id, API_TO_DB_PROVIDER[providerKey]);
    return { ok: true };
  } catch {
    return { error: t("api.errors.disconnectFailed") };
  }
}

/** Shared by the OAuth callback routes: encrypt + upsert a fresh token set. */
export async function storeOAuthTokens(
  companyId: string,
  provider: DbProvider,
  tokens: TokenSet,
): Promise<void> {
  // upsertImportConnection encrypts the tokens; a missing
  // IMPORT_ENCRYPTION_KEY throws a clear setup error there.
  await upsertImportConnection(companyId, provider, tokens);
}
