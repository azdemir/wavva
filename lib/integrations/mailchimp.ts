/**
 * Mailchimp Marketing API v3 client (server-only).
 *
 * Auth: API-key based — `Authorization: Basic base64("anystring:"+apiKey)`.
 * The data center is the suffix after the LAST hyphen of the key
 * (e.g. a key ending "-us21" → https://us21.api.mailchimp.com/3.0).
 * Keys are created by the user at Mailchimp Account → Extras → API keys;
 * no OAuth app is needed.
 *
 * Members are added with `status_if_new: "subscribed"` — an existing
 * member's status is never overwritten, so we never resubscribe someone
 * who unsubscribed.
 */

import { createHash } from "node:crypto";

const TIMEOUT_MS = 15_000;

export type MailchimpAccount = {
  /** Data-center subdomain, e.g. "us21". */
  dc: string;
  accountName: string;
};

export type MailchimpAudience = {
  id: string;
  name: string;
  memberCount: number;
};

/** Extract the data-center suffix from an API key. Null when malformed. */
export function dataCenterFromKey(key: string): string | null {
  const idx = key.lastIndexOf("-");
  if (idx < 0) return null;
  const dc = key.slice(idx + 1).trim().toLowerCase();
  return /^[a-z0-9]+$/.test(dc) ? dc : null;
}

async function mailchimpFetch<T>(
  dc: string,
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");
    const res = await fetch(`https://${dc}.api.mailchimp.com/3.0${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      let detail = "";
      try {
        const body = (await res.json()) as { title?: string; detail?: string };
        detail = body.detail || body.title || "";
      } catch {
        detail = await res.text().catch(() => "");
      }
      throw new Error(
        `Mailchimp API error ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      );
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Validate a key against GET /3.0/. Throws when invalid. */
export async function validateApiKey(apiKey: string): Promise<MailchimpAccount> {
  const dc = dataCenterFromKey(apiKey.trim());
  if (!dc) {
    throw new Error(
      "That doesn't look like a Mailchimp API key — it should end with a data-center suffix like -us21.",
    );
  }
  const root = await mailchimpFetch<{ account_name?: string }>(dc, apiKey.trim(), "/");
  return { dc, accountName: root.account_name ?? "" };
}

/** List the account's audiences (lists). Throws on API errors. */
export async function listAudiences(
  dc: string,
  apiKey: string,
): Promise<MailchimpAudience[]> {
  const res = await mailchimpFetch<{
    lists?: { id: string; name: string; stats?: { member_count?: number } }[];
  }>(dc, apiKey, "/lists?count=100&fields=lists.id,lists.name,lists.stats.member_count");
  return (res.lists ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    memberCount: l.stats?.member_count ?? 0,
  }));
}

export type SyncCustomer = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
};

/**
 * Upsert a single member (PUT is idempotent). Uses `status_if_new` so an
 * existing member who unsubscribed is never resubscribed.
 */
export async function upsertMember(
  dc: string,
  apiKey: string,
  listId: string,
  customer: SyncCustomer,
): Promise<void> {
  const hash = createHash("md5").update(customer.email.trim().toLowerCase()).digest("hex");
  await mailchimpFetch(dc, apiKey, `/lists/${listId}/members/${hash}`, {
    method: "PUT",
    body: JSON.stringify({
      email_address: customer.email.trim(),
      status_if_new: "subscribed",
      merge_fields: {
        FNAME: customer.firstName ?? "",
        LNAME: customer.lastName ?? "",
        PHONE: customer.phone ?? "",
      },
    }),
  });
}
