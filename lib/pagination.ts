/** Shared pagination helpers for dashboard list pages. */

export const PAGE_SIZE = 25;

/** Parse ?page= into a safe 1-based page number. */
export function parsePageParam(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 10_000) : 1;
}
