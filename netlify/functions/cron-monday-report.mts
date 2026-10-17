// Netlify Scheduled Function: Monday Front Office report.
//
// Mirrors the old Vercel cron exactly: { "path": "/api/cron/monday-report",
// "schedule": "0 * * * *" } — hourly. The route itself gates on the Monday
// 07:00–07:59 window in each company's own timezone and is idempotent per
// week via the unique (company_id, week_start) key on front_office_reports.
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
    const result = await pingCron("/api/cron/monday-report");
    console.log(`[cron-monday-report] ok: ${result}`);
  } catch (err) {
    console.error(`[cron-monday-report] failed:`, err);
    throw err; // non-2xx so Netlify logs the failure
  }
};

export const config: Config = {
  schedule: "0 * * * *", // hourly — mirrors vercel.json; route gates to Mon 07:00 local
};
