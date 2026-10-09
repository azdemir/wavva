/**
 * Google Calendar import provider (OAuth2, read-only event scope).
 *
 * Fetches events from the last 90 days plus upcoming events (capped),
 * turning each into an appointment row. The first attendee's email doubles
 * as the customer email so duplicate detection can match existing
 * customers.
 *
 * NOTE: Google requires OAuth app verification (homepage, privacy policy,
 * authorized domain) before production use. Until then this works for test
 * users added in the Google Cloud console.
 */

import type { MappedRow } from "@/lib/import/validate";
import { cap } from "@/lib/import/validate";
import type { FetchResult, TokenSet } from "./types";
import { capRecords, MAX_API_RECORDS } from "./types";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events.readonly";

export function isGoogleConfigured(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
}

export function buildGoogleAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPE,
    access_type: "offline", // get a refresh token
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

function clientAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set.");
  }
  return { clientId, clientSecret };
}

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
  if (!res.ok) throw new Error(`Google token request failed (${res.status}).`);
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!json.access_token) throw new Error("Google did not return an access token.");
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: json.expires_in
      ? new Date(Date.now() + json.expires_in * 1000).toISOString()
      : null,
  };
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
): Promise<TokenSet> {
  return postToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
}

export async function refreshGoogleToken(refreshToken: string): Promise<TokenSet> {
  return postToken({ grant_type: "refresh_token", refresh_token: refreshToken });
}

/** Public account facts for the "Connected as X" label. */
export async function fetchGoogleAccountEmail(
  accessToken: string,
): Promise<string | null> {
  try {
    const res = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { email?: string };
    return json.email?.trim() || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Normalization to MappedRow
// ---------------------------------------------------------------------------

type GEvent = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { email?: string; displayName?: string; self?: boolean }[];
  status?: string;
};

function eventTime(e: GEvent["start"]): string {
  return (e?.dateTime ?? e?.date ?? "").trim();
}

/** Best-effort name from an attendee (display name, else email local part). */
function attendeeName(email: string, displayName?: string): string {
  const dn = (displayName ?? "").trim();
  if (dn) return dn;
  const local = email.split("@")[0] ?? "";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function eventToRow(e: GEvent): MappedRow | null {
  if (e.status === "cancelled") return null;
  const start = eventTime(e.start);
  if (!start) return null;

  // Skip the calendar owner's own events as customers: only import events
  // that invite someone else.
  const attendees = (e.attendees ?? []).filter((a) => !a.self && a.email?.trim());
  const first = attendees[0];
  const email = first?.email?.trim() ?? "";

  const row: MappedRow = {};
  const summary = (e.summary ?? "").trim();
  if (summary) row.appt_service = cap(summary);
  // ISO dateTime — parseApptDate handles it; all-day `date` → 9:00 AM local.
  row.appt_start = start;
  const end = eventTime(e.end);
  if (end) row.appt_end = end;

  const noteParts: string[] = [];
  const location = (e.location ?? "").trim();
  if (location) noteParts.push(`Location: ${location}`);
  const description = (e.description ?? "").trim();
  if (description) noteParts.push(description);
  if (noteParts.length > 0) row.appt_notes = cap(noteParts.join("\n"));

  if (email) {
    row.appt_customer_email = cap(email);
    row.email = cap(email); // lets duplicate detection match existing customers
    row.name = cap(attendeeName(email, first?.displayName));
  } else if (summary) {
    // No attendee — still importable as an appointment-only hint row
    // keyed off the event title. Name is required by validation, so use
    // the summary as a last resort.
    row.name = cap(`Calendar: ${summary}`.slice(0, 120));
  } else {
    return null;
  }
  return row;
}

export async function fetchGoogleRows(accessToken: string): Promise<FetchResult> {
  try {
    const now = new Date();
    const timeMin = new Date(now.getTime() - 90 * 24 * 3600 * 1000).toISOString();
    const timeMax = new Date(now.getTime() + 180 * 24 * 3600 * 1000).toISOString();

    const rows: MappedRow[] = [];
    let pageToken: string | null = null;
    for (;;) {
      const params = new URLSearchParams({
        singleEvents: "true",
        orderBy: "startTime",
        timeMin,
        timeMax,
        maxResults: "250",
      });
      if (pageToken) params.set("pageToken", pageToken);
      const res = await fetch(`${EVENTS_URL}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401) return { error: "unauthorized" };
      if (!res.ok) throw new Error(`Google Calendar request failed (${res.status}).`);
      const json = (await res.json()) as {
        items?: GEvent[];
        nextPageToken?: string;
      };
      for (const item of json.items ?? []) {
        const row = eventToRow(item);
        if (row) rows.push(row);
        if (rows.length >= MAX_API_RECORDS) break;
      }
      pageToken = json.nextPageToken ?? null;
      if (!pageToken || rows.length >= MAX_API_RECORDS) break;
    }

    const { items } = capRecords(rows);
    return { rows: items };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
