// Netlify Scheduled Function: day-before + overdue + quote-follow-up notifications.
//
// Mirrors the old Vercel cron exactly: { "path": "/api/cron/notifications",
// "schedule": "0 12 * * *" } — daily at 12:00 UTC (08:00 EDT).
//
// The function simply pings the existing Next.js route on the live site with
// the CRON_SECRET bearer token; all logic stays in the app. No new deps.

import type { Config } from "@netlify/functions";

async function pingCron(path: string): Promise<string> {
  const siteUrl = (process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const secret = process.env.CRON_SECRET;
  if (!siteUrl) throw new Error("Missing site URL: set URL or NEXT_PUBLIC_SITE_URL in Netlify env vars.");
  if (!secret) throw new Error("Missing CRON_SECRET in Netlify env vars.");

  const res = await fetch(`${siteUrl}${path}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = (await res.text()).slice(0, 500);
  if (!res.ok) throw new Error(`Cron route ${path} returned ${res.status}: ${body}`);
  return `${res.status} ${body}`;
}

export default async () => {
  try {
    const result = await pingCron("/api/cron/notifications");
    console.log(`[cron-notifications] ok: ${result}`);
  } catch (err) {
    console.error(`[cron-notifications] failed:`, err);
    throw err; // non-2xx so Netlify logs the failure
  }
};

export const config: Config = {
  schedule: "0 12 * * *", // daily 12:00 UTC — mirrors vercel.json
};
