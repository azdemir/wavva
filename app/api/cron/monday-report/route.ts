import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { FRONT_OFFICE } from "@/lib/front-office";
import { formatCents } from "@/lib/format";

/**
 * Cron endpoint: emails the one-page Monday Front Office report to every
 * company with Front Office settings, at 7am Monday in the company's own
 * timezone. Schedule hourly — the route itself checks the local time
 * window (Monday 07:00–07:59):
 *
 *   vercel.json crons: { "path": "/api/cron/monday-report", "schedule": "0 * * * *" }
 *
 * Auth: Authorization: Bearer <CRON_SECRET> (same pattern as the other
 * cron routes). Idempotent: front_office_reports has a unique
 * (company_id, week_start) key, so a company never gets two reports for
 * the same week.
 *
 *   GET /api/cron/monday-report  Authorization: Bearer <redacted>
 */

type CompanySettings = {
  company_id: string;
  timezone: string;
  companies: { name: string } | { name: string }[] | null;
};

/** Local weekday/hour for a timezone, e.g. { weekday: "Monday", hour: 7 }. */
function localParts(timezone: string, now: Date): { weekday: string; hour: number; date: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    hour: "numeric",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hourRaw = Number(get("hour"));
  return {
    weekday: get("weekday"),
    hour: hourRaw === 24 ? 0 : hourRaw,
    date: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

function money(cents: number): string {
  return formatCents(cents);
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#475569;font-size:14px;">${label}</td>
    <td style="padding:10px 0 10px 16px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;font-size:15px;color:#0f172a;">${value}</td>
  </tr>`;
}

/** One-page HTML report, mobile-friendly, plain language. */
function reportHtml(
  companyName: string,
  weekLabel: string,
  stats: {
    enquiries: number;
    booked: number;
    openQuotes: number;
    collectedCents: number;
    overdueCount: number;
    overdueCents: number;
  },
): string {
  return `<!doctype html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:24px 16px;">
  <p style="font-size:13px;color:#64748b;margin:0;">${FRONT_OFFICE.BRAND} Front Office · Monday report</p>
  <h1 style="font-size:24px;color:#0f172a;margin:8px 0 4px;">Your week at ${companyName}</h1>
  <p style="font-size:14px;color:#64748b;margin:0 0 20px;">${weekLabel}</p>
  <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:0 16px;" cellpadding="0" cellspacing="0">
    <tbody>
      ${row("New enquiries answered", String(stats.enquiries))}
      ${row("Visits booked", String(stats.booked))}
      ${row("Quotes still open", String(stats.openQuotes))}
      ${row("Money collected", money(stats.collectedCents))}
      ${row(
        `Unpaid invoices (${stats.overdueCount})`,
        money(stats.overdueCents),
      )}
    </tbody>
  </table>
  <p style="font-size:13px;color:#64748b;margin:20px 0 0;line-height:1.6;">
    Your AI assistant handled these under your company's name. Anything it
    couldn't handle came to you by text during the week.
  </p>
  <p style="font-size:13px;color:#94a3b8;margin:16px 0 0;">
    ${FRONT_OFFICE.BRAND} · ${FRONT_OFFICE.SITE_URL}
  </p>
</div>
</body>
</html>`;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = await createServiceClient();
  const now = new Date();
  const since = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();

  const { data: settings } = await svc
    .from("front_office_settings")
    .select("company_id, timezone, companies(name)")
    .limit(500);
  const rows = (settings ?? []) as unknown as CompanySettings[];

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const s of rows) {
    const tz = s.timezone || "America/New_York";
    let local: { weekday: string; hour: number; date: string };
    try {
      local = localParts(tz, now);
    } catch {
      errors.push(`${s.company_id}: bad timezone ${tz}`);
      continue;
    }
    // Only send inside the company's Monday 07:00–07:59 window.
    if (local.weekday !== "Monday" || local.hour !== 7) {
      skipped++;
      continue;
    }
    // Idempotency: one report per company per week.
    const { data: existing } = await svc
      .from("front_office_reports")
      .select("id")
      .eq("company_id", s.company_id)
      .eq("week_start", local.date)
      .limit(1);
    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    // Real data for the past week.
    const [
      { count: enquiries },
      { count: booked },
      { count: openQuotes },
      { data: payments },
      { data: overdue },
      { data: owners },
    ] = await Promise.all([
      svc.from("front_office_conversations").select("id", { count: "exact", head: true }).eq("company_id", s.company_id).eq("direction", "in").gte("created_at", since),
      svc.from("bookings").select("id", { count: "exact", head: true }).eq("company_id", s.company_id).neq("status", "canceled").gte("created_at", since),
      svc.from("quotes").select("id", { count: "exact", head: true }).eq("company_id", s.company_id).eq("status", "sent"),
      svc.from("payments").select("amount_cents").eq("company_id", s.company_id).eq("status", "succeeded").gte("created_at", since),
      svc.from("invoices").select("total_cents, amount_paid_cents").eq("company_id", s.company_id).eq("status", "overdue"),
      svc.from("memberships").select("email").eq("company_id", s.company_id).eq("role", "owner").limit(1),
    ]);

    const collectedCents = (payments ?? []).reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);
    const overdueList = (overdue ?? []) as { total_cents: number; amount_paid_cents: number }[];
    const overdueCents = overdueList.reduce(
      (sum, i) => sum + (i.total_cents ?? 0) - (i.amount_paid_cents ?? 0),
      0,
    );
    const companyName = one(s.companies)?.name ?? "your company";
    const stats = {
      enquiries: enquiries ?? 0,
      booked: booked ?? 0,
      openQuotes: openQuotes ?? 0,
      collectedCents,
      overdueCount: overdueList.length,
      overdueCents,
    };

    // Record the report (always — even if email isn't configured).
    const { error: reportError } = await svc.from("front_office_reports").insert({
      company_id: s.company_id,
      week_start: local.date,
      payload: { ...stats, window_start: since, window_end: now.toISOString() },
    });
    if (reportError && !/duplicate|unique/i.test(reportError.message)) {
      errors.push(`${s.company_id}: report insert failed`);
      continue;
    }

    const ownerEmail = (owners ?? [])[0]?.email as string | undefined;
    const resendKey = process.env.RESEND_API_KEY;
    if (!ownerEmail) {
      errors.push(`${s.company_id}: no owner email`);
      continue;
    }
    if (!resendKey) {
      console.log(`[monday-report] RESEND_API_KEY not set — report recorded but not emailed for ${companyName}.`);
      continue;
    }
    try {
      const resend = new Resend(resendKey);
      const html = reportHtml(companyName, `Week ending ${local.date}`, stats);
      const { error: sendError } = await resend.emails.send({
        from: `Switchboard <no-reply@${new URL(FRONT_OFFICE.SITE_URL).hostname}>`,
        to: ownerEmail,
        subject: `Your Monday front-office report — ${companyName}`,
        html,
      });
      if (sendError) throw sendError;
      await svc
        .from("front_office_reports")
        .update({ sent_at: new Date().toISOString() })
        .eq("company_id", s.company_id)
        .eq("week_start", local.date);
      sent++;
    } catch (err) {
      errors.push(`${s.company_id}: email failed (${err instanceof Error ? err.message : "unknown"})`);
    }
  }

  return NextResponse.json({ sent, skipped, errors });
}
