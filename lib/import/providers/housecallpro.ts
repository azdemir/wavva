/**
 * Housecall Pro import provider (REST API key auth).
 *
 * Verified against Housecall Pro's public API docs + integration guides:
 *   base:  https://api.housecallpro.com/v1
 *   auth:  Authorization: Token <api_key>
 *   list:  GET /customers, GET /jobs → { customers|jobs: [...], next_page_url }
 * Pagination follows `next_page_url` until exhausted (capped).
 *
 * NOTE: API keys can only be generated on Housecall Pro's MAX plan. The UI
 * must say so and point everyone else at CSV upload.
 */

import type { MappedRow } from "@/lib/import/validate";
import { cap } from "@/lib/import/validate";
import type { FetchResult } from "./types";
import { capRecords, MAX_API_RECORDS } from "./types";

const BASE = "https://api.housecallpro.com/v1";

export function isHousecallConfigured(): boolean {
  // No platform-level env vars: the user pastes their own API key in the UI.
  return true;
}

function headers(apiKey: string): Record<string, string> {
  return {
    Authorization: `Token ${apiKey}`,
    Accept: "application/json",
  };
}

async function getJson(url: string, apiKey: string): Promise<Record<string, unknown>> {
  const res = await fetch(url, { headers: headers(apiKey) });
  if (res.status === 401 || res.status === 403) {
    throw new Error("housecall_unauthorized");
  }
  if (res.status === 429) throw new Error("Rate limited by Housecall Pro — try again in a minute.");
  if (!res.ok) throw new Error(`Housecall Pro request failed (${res.status}).`);
  return (await res.json()) as Record<string, unknown>;
}

/** Follow next_page_url pages of a list endpoint. Returns items + account info. */
async function fetchAll(
  apiKey: string,
  path: string,
  itemKey: "customers" | "jobs",
): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  let url: string | null = `${BASE}${path}`;
  const seen = new Set<string>();
  for (;;) {
    if (!url || seen.has(url) || out.length >= MAX_API_RECORDS) break;
    seen.add(url);
    const json = await getJson(url, apiKey);
    const items = json[itemKey];
    if (Array.isArray(items)) {
      out.push(...(items as Record<string, unknown>[]));
    }
    const next = json.next_page_url;
    url = typeof next === "string" && next ? next : null;
    // next_page_url may be relative — resolve against the API base.
    if (url && url.startsWith("/")) url = `https://api.housecallpro.com${url}`;
  }
  return out.slice(0, MAX_API_RECORDS);
}

/** Lightweight key check: one small page of customers. */
export async function verifyHousecallKey(apiKey: string): Promise<boolean> {
  try {
    await getJson(`${BASE}/customers`, apiKey);
    return true;
  } catch {
    return false;
  }
}

export async function fetchHousecallAccountName(apiKey: string): Promise<string | null> {
  try {
    const json = await getJson(`${BASE}/company`, apiKey);
    const company = json.company as Record<string, unknown> | undefined;
    const name = company?.name ?? json.name;
    return typeof name === "string" && name.trim() ? name.trim() : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Normalization to MappedRow (field names per Housecall Pro's API docs;
// each picker tolerates the documented shape plus close variants)
// ---------------------------------------------------------------------------

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function pick(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = str(obj[k]);
    if (v) return v;
  }
  return "";
}

function firstAddress(c: Record<string, unknown>): Record<string, unknown> | null {
  const addrs = c.addresses;
  if (Array.isArray(addrs) && addrs.length > 0) {
    return addrs[0] as Record<string, unknown>;
  }
  return null;
}

function applyAddress(row: MappedRow, a: Record<string, unknown> | null) {
  if (!a) return;
  const line1 = pick(a, "street", "street1", "address_line1", "line1");
  const line2 = pick(a, "street_line_2", "street2", "address_line2", "line2");
  const city = pick(a, "city");
  const state = pick(a, "state", "province");
  const zip = pick(a, "zip", "postal_code", "postalCode");
  if (line1) row.address_line1 = cap(line1);
  if (line2) row.address_line2 = cap(line2);
  if (city) row.city = cap(city);
  if (state) row.state = cap(state);
  if (zip) row.zip = cap(zip);
}

function customerToRow(c: Record<string, unknown>): MappedRow {
  const row: MappedRow = {};
  const first = pick(c, "first_name", "firstName");
  const last = pick(c, "last_name", "lastName");
  const full = pick(c, "name", "full_name", "display_name");
  const company = pick(c, "company", "company_name");
  if (first) row.first_name = cap(first);
  if (last) row.last_name = cap(last);
  row.name = cap(company || full || [first, last].filter(Boolean).join(" "));
  if (company) row.customer_type = "commercial";
  const email = pick(c, "email", "email_address");
  if (email) row.email = cap(email);
  const phone = pick(c, "mobile_number", "mobile", "phone", "phone_number", "home_number", "work_number");
  if (phone) row.phone = cap(phone);
  const notes = pick(c, "notes", "note");
  if (notes) row.notes = cap(notes);
  applyAddress(row, firstAddress(c));
  return row;
}

export async function fetchHousecallRows(apiKey: string): Promise<FetchResult> {
  try {
    const [customers, jobs] = await Promise.all([
      fetchAll(apiKey, "/customers", "customers"),
      fetchAll(apiKey, "/jobs", "jobs"),
    ]);

    const byId = new Map<string, MappedRow>();
    const emailById = new Map<string, string>();
    for (const c of customers) {
      const id = str(c.id);
      const row = customerToRow(c);
      if (id) {
        byId.set(id, row);
        if (row.email) emailById.set(id, row.email);
      }
    }

    const rows: MappedRow[] = [];
    const seenCustomerIds = new Set<string>();

    for (const j of jobs) {
      const customerId = str(j.customer_id ?? j.customerId);
      let base = customerId ? byId.get(customerId) : undefined;
      let email = customerId ? emailById.get(customerId) : undefined;

      // Some job payloads embed the customer object.
      const embedded = j.customer as Record<string, unknown> | undefined;
      if (!base && embedded && typeof embedded === "object") {
        base = customerToRow(embedded);
        email = base.email;
      }
      if (!base) continue;

      if (customerId) seenCustomerIds.add(customerId);
      const row: MappedRow = { ...base };
      // Prefer the job's own address (where the work happens).
      const jobAddr = (j.address ?? j.service_address) as Record<string, unknown> | undefined;
      if (jobAddr && typeof jobAddr === "object") applyAddress(row, jobAddr);
      if (email) row.appt_customer_email = email;

      const service = pick(j, "job_type", "type", "title", "name", "description");
      if (service) row.appt_service = cap(service);
      const start = pick(j, "scheduled_start", "scheduledStart", "start", "start_time", "scheduled_at");
      const end = pick(j, "scheduled_end", "scheduledEnd", "end", "end_time");
      if (start) row.appt_start = start; // ISO — parseApptDate handles it
      if (end) row.appt_end = end;
      const notes = pick(j, "notes", "note", "instructions", "description");
      if (notes && notes !== service) row.appt_notes = cap(notes);
      rows.push(row);
      if (rows.length >= MAX_API_RECORDS) break;
    }

    // Customers without jobs: customer-only rows.
    for (const [id, row] of byId) {
      if (seenCustomerIds.has(id)) continue;
      rows.push({ ...row });
      if (rows.length >= MAX_API_RECORDS) break;
    }

    const { items } = capRecords(rows);
    return { rows: items };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "housecall_unauthorized") return { error: "unauthorized" };
    return { error: message };
  }
}
