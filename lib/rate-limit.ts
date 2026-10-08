import { headers } from "next/headers";

/**
 * Simple in-memory rate limiter for server actions and route handlers.
 *
 * NOT distributed — each server instance tracks its own counters. Good
 * enough to blunt brute-force and spam on a single-region deployment;
 * use Upstash/Redis for multi-region.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Prune stale buckets every 5 minutes.
let lastPrune = Date.now();
function prune() {
  const now = Date.now();
  if (now - lastPrune < 5 * 60_000) return;
  lastPrune = now;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

async function clientKey(prefix: string): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  return `${prefix}:${ip}`;
}

export type RateLimit = { allowed: boolean; remaining: number; resetIn: number };

/**
 * Check (and consume) one token from the bucket. Returns whether the
 * request may proceed.
 */
export async function rateLimit(
  prefix: string,
  max: number,
  windowMs: number,
): Promise<RateLimit> {
  prune();
  const key = await clientKey(prefix);
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetIn: windowMs };
  }
  if (bucket.count >= max) {
    return { allowed: false, remaining: 0, resetIn: bucket.resetAt - now };
  }
  bucket.count += 1;
  return {
    allowed: true,
    remaining: max - bucket.count,
    resetIn: bucket.resetAt - now,
  };
}

/** Presets. */
export const limits = {
  /** Login / signup: 10 attempts per 10 minutes per IP. */
  auth: { max: 10, windowMs: 10 * 60_000 },
  /** Contact form / invites: 5 per hour per IP. */
  spammy: { max: 5, windowMs: 60 * 60_000 },
  /** General mutations: 60 per minute per IP. */
  mutation: { max: 60, windowMs: 60_000 },
} as const;

/** Standard "slow down" error for actions. */
export function rateLimitError(resetIn: number) {
  const secs = Math.ceil(resetIn / 1000);
  return { error: `Too many attempts. Try again in ${secs} seconds.` };
}
