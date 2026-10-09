/**
 * Jobber import provider (OAuth2 + GraphQL).
 *
 * OAuth endpoints (verified against Jobber's developer docs + official app
 * template):
 *   authorize: https://api.getjobber.com/oauth/authorize
 *   token:     https://api.getjobber.com/oauth/token  (urlencoded POST)
 * GraphQL:     https://api.getjobber.com/api/graphql
 *   Headers: Authorization: Bearer <token>, X-JOBBER-GRAPHQL-VERSION, JSON body
 *
 * Scopes below are a best-effort default — the exact scope names must match
 * what the Jobber app was created with in Jobber's Developer Center.
 */

import type { MappedRow } from "@/lib/import/validate";
import { cap } from "@/lib/import/validate";
import type { FetchResult, TokenSet } from "./types";
import { capRecords, MAX_API_RECORDS } from "./types";

const AUTHORIZE_URL = "https://api.getjobber.com/oauth/authorize";
const TOKEN_URL = "https://api.getjobber.com/oauth/token";
const GRAPHQL_URL = "https://api.getjobber.com/api/graphql";
const GRAPHQL_VERSION = "2025-04-16";

/** Scopes requested during OAuth. Adjust if your Jobber app uses others. */
const SCOPES = ["read_clients", "read_jobs"];

export function isJobberConfigured(): boolean {
  return !!process.env.JOBBER_CLIENT_ID && !!process.env.JOBBER_CLIENT_SECRET;
}

export function buildJobberAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.JOBBER_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(","),
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

function clientAuth() {
  const clientId = process.env.JOBBER_CLIENT_ID ?? "";
  const clientSecret = process.env.JOBBER_CLIENT_SECRET ?? "";
  if (!clientId || !clientSecret) {
    throw new Error("JOBBER_CLIENT_ID / JOBBER_CLIENT_SECRET are not set.");
  }
  return { clientId, clientSecret };
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

async function postToken(body: Record<string, string>): Promise<TokenSet> {
  const { clientId, clientSecret } = clientAuth();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ...body,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`Jobber token request failed (${res.status}).`);
  const json = (await res.json()) as TokenResponse;
  if (!json.access_token) throw new Error("Jobber did not return an access token.");
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: json.expires_in
      ? new Date(Date.now() + json.expires_in * 1000).toISOString()
      : null,
  };
}

export async function exchangeJobberCode(
  code: string,
  redirectUri: string,
): Promise<TokenSet> {
  return postToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
}

export async function refreshJobberToken(refreshToken: string): Promise<TokenSet> {
  return postToken({ grant_type: "refresh_token", refresh_token: refreshToken });
}

async function graphql<T>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-JOBBER-GRAPHQL-VERSION": GRAPHQL_VERSION,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401) throw new Error("jobber_unauthorized");
  if (!res.ok) throw new Error(`Jobber API request failed (${res.status}).`);
  const json = (await res.json()) as {
    data?: T;
    errors?: { message?: string }[];
  };
  if (json.errors?.length) {
    throw new Error(`Jobber API error: ${json.errors[0]?.message ?? "unknown"}`);
  }
  if (!json.data) throw new Error("Jobber API returned no data.");
  return json.data;
}

/** Public account facts for the "Connected as X" label. */
export async function fetchJobberAccountName(
  accessToken: string,
): Promise<string | null> {
  try {
    const data = await graphql<{ account: { name?: string } | null }>(
      accessToken,
      "query { account { name } }",
    );
    return data.account?.name ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Normalization to MappedRow
// ---------------------------------------------------------------------------

type JobberAddress = {
  street1?: string | null;
  street2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

type JobberClient = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  isCompany?: boolean | null;
  email?: string | null;
  emails?: { address?: string | null }[] | null;
  defaultPhones?: (string | null)[] | null;
  phones?: { number?: string | null }[] | null;
  notes?: string | null;
  billingAddress?: JobberAddress | null;
};

type JobberVisit = {
  id: string;
  title?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  instructions?: string | null;
  property?: { address?: JobberAddress | null } | null;
};

type JobberJob = {
  id: string;
  title?: string | null;
  client?: JobberClient | null;
  property?: { address?: JobberAddress | null } | null;
  visits?: { nodes?: (JobberVisit | null)[] | null } | null;
};

const CLIENT_QUERY = `
  query ImportClients($first: Int!, $after: String) {
    clients(first: $first, after: $after) {
      nodes {
        id firstName lastName companyName isCompany notes
        email
        emails { address }
        defaultPhones
        phones { number }
        billingAddress { street1 street2 city province postalCode country }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const JOB_QUERY = `
  query ImportJobs($first: Int!, $after: String) {
    jobs(first: $first, after: $after) {
      nodes {
        id title
        client {
          id firstName lastName companyName isCompany notes
          email
          emails { address }
          defaultPhones
          phones { number }
          billingAddress { street1 street2 city province postalCode country }
        }
        property { address { street1 street2 city province postalCode country } }
        visits(first: 50) {
          nodes {
            id title startAt endAt instructions
            property { address { street1 street2 city province postalCode country } }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

type PageInfo = { hasNextPage: boolean; endCursor: string | null };
type ClientPage = {
  clients: { nodes: JobberClient[]; pageInfo: PageInfo };
};
type JobPage = {
  jobs: { nodes: JobberJob[]; pageInfo: PageInfo };
};

async function fetchAllClients(accessToken: string): Promise<JobberClient[]> {
  const out: JobberClient[] = [];
  let after: string | null = null;
  for (;;) {
    const data: ClientPage = await graphql<ClientPage>(accessToken, CLIENT_QUERY, {
      first: 100,
      after,
    });
    out.push(...(data.clients.nodes ?? []));
    if (!data.clients.pageInfo.hasNextPage || out.length >= MAX_API_RECORDS) break;
    after = data.clients.pageInfo.endCursor;
    if (!after) break;
  }
  return out.slice(0, MAX_API_RECORDS);
}

async function fetchAllJobs(accessToken: string): Promise<JobberJob[]> {
  const out: JobberJob[] = [];
  let after: string | null = null;
  for (;;) {
    const data: JobPage = await graphql<JobPage>(accessToken, JOB_QUERY, {
      first: 50,
      after,
    });
    out.push(...(data.jobs.nodes ?? []));
    if (!data.jobs.pageInfo.hasNextPage || out.length >= MAX_API_RECORDS) break;
    after = data.jobs.pageInfo.endCursor;
    if (!after) break;
  }
  return out.slice(0, MAX_API_RECORDS);
}

function pickEmail(c: JobberClient): string {
  const fromList = (c.emails ?? [])
    .map((e) => (e?.address ?? "").trim())
    .find(Boolean);
  return (c.email ?? "").trim() || fromList || "";
}

function pickPhone(c: JobberClient): string {
  const fromDefault = (c.defaultPhones ?? []).map((p) => (p ?? "").trim()).find(Boolean);
  const fromList = (c.phones ?? [])
    .map((p) => (p?.number ?? "").trim())
    .find(Boolean);
  return fromDefault || fromList || "";
}

function applyAddress(row: MappedRow, a: JobberAddress | null | undefined) {
  if (!a) return;
  if (a.street1?.trim()) row.address_line1 = cap(a.street1.trim());
  if (a.street2?.trim()) row.address_line2 = cap(a.street2.trim());
  if (a.city?.trim()) row.city = cap(a.city.trim());
  if (a.province?.trim()) row.state = cap(a.province.trim());
  if (a.postalCode?.trim()) row.zip = cap(a.postalCode.trim());
}

function clientToRow(c: JobberClient): MappedRow {
  const row: MappedRow = {};
  const first = (c.firstName ?? "").trim();
  const last = (c.lastName ?? "").trim();
  if (first) row.first_name = cap(first);
  if (last) row.last_name = cap(last);
  const company = (c.companyName ?? "").trim();
  row.name = cap(company || [first, last].filter(Boolean).join(" "));
  const email = pickEmail(c);
  if (email) row.email = cap(email);
  const phone = pickPhone(c);
  if (phone) row.phone = cap(phone);
  if (c.isCompany || company) row.customer_type = "commercial";
  const notes = (c.notes ?? "").trim();
  if (notes) row.notes = cap(notes);
  applyAddress(row, c.billingAddress);
  return row;
}

function visitToRows(job: JobberJob, clientRow: MappedRow, clientEmail: string): MappedRow[] {
  const visits = (job.visits?.nodes ?? []).filter(Boolean) as JobberVisit[];
  if (visits.length === 0) return [];
  return visits.map((v) => {
    const row: MappedRow = { ...clientRow };
    // Prefer the visit's property address (where the work happens).
    applyAddress(row, v.property?.address ?? job.property?.address);
    if (clientEmail) row.appt_customer_email = clientEmail;
    const title = (v.title ?? "").trim() || (job.title ?? "").trim();
    if (title) row.appt_service = cap(title);
    // ISO 8601 with offset — parseApptDate handles it directly.
    if (v.startAt?.trim()) row.appt_start = v.startAt.trim();
    if (v.endAt?.trim()) row.appt_end = v.endAt.trim();
    const instructions = (v.instructions ?? "").trim();
    if (instructions) row.appt_notes = cap(instructions);
    return row;
  });
}

export async function fetchJobberRows(accessToken: string): Promise<FetchResult> {
  try {
    const [clients, jobs] = await Promise.all([
      fetchAllClients(accessToken),
      fetchAllJobs(accessToken),
    ]);

    const seenClientIds = new Set<string>();
    const rows: MappedRow[] = [];

    // Jobs first: each visit becomes a customer row + appointment fields.
    for (const job of jobs) {
      const client = job.client;
      const clientRow = client ? clientToRow(client) : null;
      if (client && client.id) seenClientIds.add(client.id);
      if (!clientRow) continue;
      const visitRows = visitToRows(job, clientRow, client ? pickEmail(client) : "");
      if (visitRows.length > 0) {
        rows.push(...visitRows);
      } else {
        // Job with no visits: customer-only row.
        rows.push(clientRow);
      }
      if (rows.length >= MAX_API_RECORDS) break;
    }

    // Remaining clients (no jobs): customer-only rows.
    for (const c of clients) {
      if (seenClientIds.has(c.id)) continue;
      rows.push(clientToRow(c));
      if (rows.length >= MAX_API_RECORDS) break;
    }

    const { items } = capRecords(rows);
    return { rows: items };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "jobber_unauthorized") return { error: "unauthorized" };
    return { error: message };
  }
}
