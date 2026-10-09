import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { processNotificationQueue } from "@/lib/notifications/send";
import { enqueueNotification } from "@/lib/notifications/queue";
import { getPortalLinkForCron } from "@/lib/followups";
import { one } from "@/lib/relations";
import { formatDate, formatTime } from "@/lib/format";

/**
 * Cron endpoint: drains the notification queue, enqueues day-before
 * reminders (customers + assigned cleaners), sends overdue payment
 * reminders, and sends due quote follow-ups. Schedule it daily (e.g.
 * Vercel Cron, or any scheduler hitting this URL with the
 * CRON_SECRET Bearer <redacted>).
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
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();

  // ------------------------------------------------------------------
  // Day-before reminders for jobs starting in 12–36h.
  // ------------------------------------------------------------------
  const from = new Date(now.getTime() + 12 * 3600 * 1000).toISOString();
  const to = new Date(now.getTime() + 36 * 3600 * 1000).toISOString();

  const { data: jobs } = await svc
    .from("jobs")
    .select(
      "id, company_id, scheduled_start, scheduled_end, customer_id, assigned_user_ids, customers(name, email, phone, sms_consent), service_addresses(address_line1, city), companies(name, timezone)",
    )
    .eq("status", "scheduled")
    .gte("scheduled_start", from)
    .lt("scheduled_start", to)
    .limit(200);

  let customerReminders = 0;
  let cleanerReminders = 0;
  for (const job of jobs ?? []) {
    const customer = one(job.customers) as {
      name: string;
      email: string | null;
      phone: string | null;
      sms_consent: boolean | null;
    } | null;
    const address = one(job.service_addresses) as {
      address_line1: string | null;
      city: string | null;
    } | null;
    const company = one(job.companies) as { name: string; timezone: string | null } | null;
    const tz = company?.timezone || "America/New_York";
    const addrStr = `${address?.address_line1 ?? ""}, ${address?.city ?? ""}`;
    const timeStr = `${formatTime(job.scheduled_start, tz)} – ${formatTime(job.scheduled_end, tz)}`;
    const dateStr = formatDate(job.scheduled_start);

    // booking_reminder → customer (email + SMS when consented), per channel.
    if (customer) {
      const channels: ("email" | "sms")[] = [];
      if (customer.email) channels.push("email");
      if (customer.phone && customer.sms_consent) channels.push("sms");
      for (const channel of channels) {
        const { data: existing } = await svc
          .from("notifications")
          .select("id")
          .eq("template", "booking_reminder")
          .eq("channel", channel)
          .contains("payload", { job_id: job.id })
          .limit(1);
        if (existing && existing.length > 0) continue;
        await enqueueNotification(svc, {
          company_id: job.company_id,
          recipient_type: "customer",
          recipient_id: job.customer_id,
          channel,
          template: "booking_reminder",
          payload: {
            job_id: job.id,
            email: channel === "email" ? customer.email : undefined,
            phone: channel === "sms" ? customer.phone : undefined,
            recipient_name: customer.name,
            company_name: company?.name ?? "Your cleaning company",
            date: dateStr,
            time: timeStr,
            address: addrStr,
          },
        });
        customerReminders++;
      }
    }

    // job_reminder → each assigned cleaner (email; crew SMS needs phone
    // numbers, which memberships don't collect yet).
    const assigneeIds = (job.assigned_user_ids ?? []) as string[];
    if (assigneeIds.length > 0) {
      const { data: members } = await svc
        .from("memberships")
        .select("user_id, email")
        .eq("company_id", job.company_id)
        .in("user_id", assigneeIds);
      for (const m of members ?? []) {
        if (!m.email) continue;
        const { data: existing } = await svc
          .from("notifications")
          .select("id")
          .eq("template", "job_reminder")
          .eq("channel", "email")
          .eq("recipient_id", m.user_id)
          .contains("payload", { job_id: job.id })
          .limit(1);
        if (existing && existing.length > 0) continue;
        const localPart: string = m.email.split("@")[0] ?? "";
        const prettyName =
          localPart
            .split(/[._-]+/)
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ") || undefined;
        await enqueueNotification(svc, {
          company_id: job.company_id,
          recipient_type: "user",
          recipient_id: m.user_id,
          channel: "email",
          template: "job_reminder",
          payload: {
            job_id: job.id,
            email: m.email,
            recipient_name: prettyName,
            company_name: company?.name ?? "Your cleaning company",
            date: dateStr,
            time: timeStr,
            customer_name: customer?.name,
            address: addrStr,
            job_link: `${siteUrl}/dashboard/jobs/${job.id}`,
          },
        });
        cleanerReminders++;
      }
    }
  }

  // ------------------------------------------------------------------
  // Overdue payment reminders: invoices past due_date get one reminder
  // per channel per day; "sent" invoices flip to "overdue" automatically.
  // ------------------------------------------------------------------
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const { data: overdue } = await svc
    .from("invoices")
    .select(
      "id, company_id, status, invoice_number, total_cents, due_date, customer_id, customers(name, email, phone, sms_consent), companies(name)",
    )
    .in("status", ["sent", "overdue"])
    .lt("due_date", now.toISOString())
    .limit(200);

  let paymentReminders = 0;
  for (const inv of overdue ?? []) {
    if (inv.status === "sent") {
      await svc.from("invoices").update({ status: "overdue" }).eq("id", inv.id);
      await svc.from("audit_logs").insert({
        company_id: inv.company_id,
        actor_user_id: null,
        action: "invoice.overdue",
        entity_type: "invoice",
        entity_id: inv.id,
        metadata: { via: "cron" },
      });
    }
    const customer = one(inv.customers) as {
      name: string;
      email: string | null;
      phone: string | null;
      sms_consent: boolean | null;
    } | null;
    const company = one(inv.companies) as { name: string } | null;
    if (!customer) continue;
    const channels: ("email" | "sms")[] = [];
    if (customer.email) channels.push("email");
    if (customer.phone && customer.sms_consent) channels.push("sms");
    if (channels.length === 0) continue;

    const portalLink =
      (await getPortalLinkForCron(svc, inv.company_id, inv.customer_id, siteUrl)) ?? undefined;
    for (const channel of channels) {
      const { data: existing } = await svc
        .from("notifications")
        .select("id")
        .eq("template", "payment_reminder")
        .eq("channel", channel)
        .contains("payload", { invoice_id: inv.id })
        .gte("created_at", dayStart.toISOString())
        .limit(1);
      if (existing && existing.length > 0) continue;
      await enqueueNotification(svc, {
        company_id: inv.company_id,
        recipient_type: "customer",
        recipient_id: inv.customer_id,
        channel,
        template: "payment_reminder",
        payload: {
          invoice_id: inv.id,
          email: channel === "email" ? customer.email : undefined,
          phone: channel === "sms" ? customer.phone : undefined,
          recipient_name: customer.name,
          company_name: company?.name ?? "Your cleaning company",
          invoice_number: inv.invoice_number,
          total_cents: inv.total_cents,
          due_date: inv.due_date ? formatDate(inv.due_date) : undefined,
          portal_link: portalLink,
        },
      });
      paymentReminders++;
    }
  }

  const result = await processNotificationQueue(svc);

  // Send due quote follow-ups — only while the quote is still "sent".
  // These render through the template system (with company overrides).
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

  return NextResponse.json({
    customer_reminders_queued: customerReminders,
    cleaner_reminders_queued: cleanerReminders,
    payment_reminders_queued: paymentReminders,
    followups_sent: followups,
    ...result,
  });
}
