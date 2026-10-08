import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { processNotificationQueue } from "@/lib/notifications/send";
import { enqueueNotification } from "@/lib/notifications/queue";
import { getPortalLinkForCron } from "@/lib/followups";
import { one } from "@/lib/relations";
import { formatDate, formatTime } from "@/lib/format";

/**
 * Cron endpoint: drains the notification queue, enqueues reminders for
 * tomorrow's jobs, and sends due quote follow-ups. Schedule it daily
 * (e.g. Vercel Cron, or any scheduler hitting this URL with the
 * CRON_SECRET bearer token).
 *
 *   GET /api/cron/notifications  Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = await createServiceClient();

  // Enqueue reminders for jobs starting in 12–36h that don't have one yet.
  const now = new Date();
  const from = new Date(now.getTime() + 12 * 3600 * 1000).toISOString();
  const to = new Date(now.getTime() + 36 * 3600 * 1000).toISOString();

  const { data: jobs } = await svc
    .from("jobs")
    .select(
      "id, company_id, scheduled_start, customer_id, customers(name, email), service_addresses(address_line1, city), companies(name, timezone)",
    )
    .eq("status", "scheduled")
    .gte("scheduled_start", from)
    .lt("scheduled_start", to)
    .limit(200);

  let reminders = 0;
  for (const job of jobs ?? []) {
    const { data: existing } = await svc
      .from("notifications")
      .select("id")
      .eq("template", "booking_reminder")
      .eq("channel", "email")
      .contains("payload", { job_id: job.id })
      .limit(1);
    if (existing && existing.length > 0) continue;

    const customer = Array.isArray(job.customers) ? job.customers[0] : job.customers;
    const address = Array.isArray(job.service_addresses) ? job.service_addresses[0] : job.service_addresses;
    const company = Array.isArray(job.companies) ? job.companies[0] : job.companies;
    if (!customer?.email) continue;

    await enqueueNotification(svc, {
      company_id: job.company_id,
      recipient_type: "customer",
      recipient_id: job.customer_id,
      channel: "email",
      template: "booking_reminder",
      payload: {
        job_id: job.id,
        email: customer.email,
        recipient_name: customer.name,
        company_name: company?.name ?? "Your cleaning company",
        time: formatTime(job.scheduled_start, company?.timezone || "America/New_York"),
        date: formatDate(job.scheduled_start),
        address: `${address?.address_line1 ?? ""}, ${address?.city ?? ""}`,
      },
    });
    reminders++;
  }

  const result = await processNotificationQueue(svc);

  // Send due quote follow-ups — only while the quote is still "sent".
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const { data: dueFollowups } = await svc
    .from("quote_followups")
    .select(
      "id, company_id, quote_id, step, quotes!inner(status, quote_number, total_cents, valid_until, customer_id, customers(name, email), companies(name))",
    )
    .is("sent_at", null)
    .lte("scheduled_for", now.toISOString())
    .limit(100);

  let followups = 0;
  type DueQuote = {
    status: string;
    quote_number: string;
    total_cents: number;
    valid_until: string | null;
    customer_id: string;
    customers: { name: string; email: string | null } | { name: string; email: string | null }[] | null;
    companies: { name: string } | { name: string }[] | null;
  };
  for (const f of dueFollowups ?? []) {
    const quote = one((f as { quotes: DueQuote | DueQuote[] | null }).quotes);
    const customer = one(quote?.customers);
    const company = one(quote?.companies);
    // Stale (quote moved on) or no email → drop the touch.
    if (quote?.status !== "sent" || !customer?.email) {
      await svc.from("quote_followups").delete().eq("id", f.id);
      continue;
    }
    const portalLink =
      (await getPortalLinkForCron(svc, f.company_id, quote.customer_id, siteUrl)) ?? undefined;
    await enqueueNotification(svc, {
      company_id: f.company_id,
      recipient_type: "customer",
      recipient_id: quote.customer_id,
      channel: "email",
      template: "quote_followup",
      payload: {
        email: customer.email,
        recipient_name: customer.name,
        company_name: company?.name ?? "Your cleaning company",
        quote_number: quote.quote_number,
        total_cents: quote.total_cents,
        valid_until: quote.valid_until ? formatDate(quote.valid_until) : undefined,
        portal_link: portalLink,
      },
    });
    await svc.from("quote_followups").update({ sent_at: new Date().toISOString() }).eq("id", f.id);
    followups++;
  }

  return NextResponse.json({ reminders_queued: reminders, followups_sent: followups, ...result });
}
