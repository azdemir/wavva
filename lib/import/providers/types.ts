/**
 * Shared types for API import providers (Jobber, Housecall Pro, Google
 * Calendar). Providers normalize remote records into MappedRow so the
 * existing CSV pipeline (preview → duplicates → commit) can be reused.
 */

import type { MappedRow } from "@/lib/import/validate";

export type ApiProviderKey = "jobber" | "housecallpro" | "google";

export type DbProvider = "jobber" | "housecallpro" | "google_calendar";

export const API_TO_DB_PROVIDER: Record<ApiProviderKey, DbProvider> = {
  jobber: "jobber",
  housecallpro: "housecallpro",
  google: "google_calendar",
};

/** OAuth token set after exchange or refresh. */
export type TokenSet = {
  accessToken: string;
  refreshToken?: string | null;
  /** ISO timestamp of access-token expiry, when the provider reports it. */
  expiresAt?: string | null;
  /** Small public facts (account name/email) for the "Connected as X" label. */
  meta?: Record<string, unknown>;
};

export type FetchResult = {
  rows?: MappedRow[];
  error?: string;
};

/** Cap on remote records pulled per import (protects against runaway syncs). */
export const MAX_API_RECORDS = 500;

export function capRecords<T>(items: T[]): { items: T[]; capped: boolean } {
  if (items.length <= MAX_API_RECORDS) return { items, capped: false };
  return { items: items.slice(0, MAX_API_RECORDS), capped: true };
}
