"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireCompany } from "@/lib/auth";
import { isStaff, NOT_PERMITTED } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { bookingSchema } from "@/lib/validation";
import { localInputToUtc } from "@/lib/dates";
import { nextNumberAfter } from "@/lib/pricing";
import { one } from "@/lib/relations";
import { missingColumnName } from "@/lib/supabase/schema-fallback";
import { baseUrl } from "@/lib/base-url";
import { formatDate, formatTime } from "@/lib/format";
import { enqueueCustomerNotification } from "@/lib/communications/notify";

export type ActionResult = { error?: string; ok?: boolean };

type Occurrence = { start: Date; end: Date };

/** Expand a booking into its job visits. Monthly uses calendar months. */
function occurrences(start: Date, end: Date, recurrence: string): Occurrence[] {
  const out: Occurrence[] = [{ start, end }];
  const extra = { none: 0, weekly: 7, biweekly: 7, monthly: 5 }[recurrence] ?? 0;
  for (let i = 1; i <= extra; i++) {
    const s = new Date(start);
    const e = new Date(end);
    if (recurrence === "monthly") {
      s.setMonth(s.getMonth() + i);
      e.setMonth(e.getMonth() + i);
    } else {
      const days = (recurrence === "weekly" ? 7 : 14) * i;
      s.setDate(s.getDate() + days);
      e.setDate(e.getDate() + days);
    }
    out.push({ start: s, end: e });
  }
  return out;
}

export async function createBooking(input: unknown): Promise<ActionResult> {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const t = await getTranslations("bookings");
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("actions.invalidBooking") };
  }
  const tz = ctx.company.timezone || "America/New_York";
  const start = localInputToUtc(parsed.data.scheduled_start, tz);
  const end = localInputToUtc(parsed.data.scheduled_end, tz);
  if (!(end > start)) return { error: t("actions.endAfterStart") };
  // Bookings can't start in the past (1-minute grace for clock skew).
  if (start.getTime() < Date.now() - 60_000) {
    return { error: "The booking start time must be in the future." };
  }

  const supabase = await createClient();

  // Verify all references belong to this company.
  const [{ data: customer }, { data: address }] = await Promise.all([
    supabase.from("customers").select("id").eq("id", parsed.data.customer_id).eq("company_id", ctx.company.id).maybeSingle(),
    supabase.from("service_addresses").select("id, customer_id").eq("id", parsed.data.service_address_id).eq("company_id", ctx.company.id).maybeSingle(),
  ]);
  if (!customer) return { error: t("actions.customerNotFound") };
  if (!address || address.customer_id !== customer.id) {
    return { error: t("actions.addressMismatch") };
  }
  // Independent lookups run in parallel: service/quote/template verification
  // and the numbering lookup don't depend on each other.
  const [{ data: svc }, { data: q }, { data: existingNumbers }, { data: tpl }] = await Promise.all([
    parsed.data.service_id
      ? supabase.from("services").select("id").eq("id", parsed.data.service_id).eq("company_id", ctx.company.id).maybeSingle()
      : Promise.resolve({ data: { id: "__skip" } }),
    parsed.data.quote_id
      ? supabase.from("quotes").select("id").eq("id", parsed.data.quote_id).eq("company_id", ctx.company.id).maybeSingle()
      : Promise.resolve({ data: { id: "__skip" } }),
    // Numbers come from MAX(existing), not COUNT: deleted numbers are never
    // reused, so the unique constraint can't collide after deletions.
    supabase
      .from("bookings")
      .select("booking_number")
      .eq("company_id", ctx.company.id)
      .like("booking_number", "B-%"),
    parsed.data.checklist_template_id
      ? supabase
          .from("checklist_templates")
          .select("id, items")
          .eq("id", parsed.data.checklist_template_id)
          .eq("company_id", ctx.company.id)
          .maybeSingle()
      : Promise.resolve({ data: null as { id: string; items: unknown } | null }),
  ]);
  if (parsed.data.service_id && !svc) return { error: t("actions.serviceNotFound") };
  if (parsed.data.quote_id && !q) return { error: t("actions.quoteNotFound") };
  if (parsed.data.checklist_template_id && !tpl) return { error: t("actions.templateNotFound") };
  const templateItems = ((tpl?.items ?? []) as { label?: unknown }[])
    .map((i) => ({ label: String(i?.label ?? "").trim() }))
    .filter((i) => i.label.length > 0)
    .slice(0, 100);

  const settings = ctx.company.settings as { cancellation_policy?: string | null };
  const bookingRow: Record<string, unknown> = {
    company_id: ctx.company.id,
    customer_id: customer.id,
    service_address_id: address.id,
    service_id: parsed.data.service_id || null,
    quote_id: parsed.data.quote_id || null,
    booking_number: nextNumberAfter(
      "B",
      (existingNumbers ?? []).map((r) => r.booking_number),
    ),
    recurrence: parsed.data.recurrence,
    scheduled_start: start.toISOString(),
    scheduled_end: end.toISOString(),
    cancellation_policy: settings.cancellation_policy ?? null,
    notes: parsed.data.notes || null,
  };
  if (parsed.data.checklist_template_id) {
    bookingRow.checklist_template_id = parsed.data.checklist_template_id;
  }
  let { data: booking, error: bErr } = await supabase
    .from("bookings")
    .insert(bookingRow)
    .select("id")
    .single();
  if (bErr && missingColumnName(bErr) === "checklist_template_id") {
    // Migration 0015 not run yet — create the booking without the link and
    // seed the visit checklists directly from the template items instead.
    delete bookingRow.checklist_template_id;
    const retry = await supabase.from("bookings").insert(bookingRow).select("id").single();
    booking = retry.data;
    bErr = retry.error;
  }
  if (bErr || !booking) return { error: bErr?.message ?? t("actions.createFailed") };

  const seedChecklist = templateItems.map((i) => ({ ...i, done: false }));
  const jobs = occurrences(start, end, parsed.data.recurrence).map((o) => ({
    company_id: ctx.company.id,
    booking_id: booking.id,
    customer_id: customer.id,
    service_address_id: address.id,
    scheduled_start: o.start.toISOString(),
    scheduled_end: o.end.toISOString(),
    status: "scheduled",
    checklist: seedChecklist,
  }));
  const { error: jErr } = await supabase.from("jobs").insert(jobs);
  if (jErr) {
    await supabase.from("bookings").delete().eq("id", booking.id);
    return { error: jErr.message };
  }

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "booking.created",
    entity_type: "booking",
    entity_id: booking.id,
    metadata: { recurrence: parsed.data.recurrence, jobs: jobs.length },
  });

  const { data: full } = await supabase
    .from("bookings")
    .select("scheduled_start, scheduled_end, customer_id, customers(name, email, phone, sms_consent), service_addresses(address_line1, city)")
    .eq("id", booking.id)
    .single();
  const notifCustomer = one(full?.customers) as {
    name: string;
    email: string | null;
    phone: string | null;
    sms_consent: boolean | null;
  } | null;
  const addr = one(full?.service_addresses);
  if (full && notifCustomer) {
    const settings2 = ctx.company.settings as { cancellation_policy?: string | null };
    await enqueueCustomerNotification(supabase, {
      company_id: ctx.company.id,
      recipient_type: "customer",
      recipient_id: full.customer_id,
      template: "booking_confirmed",
      payload: {
        recipient_name: notifCustomer.name,
        company_name: ctx.company.name,
        date: formatDate(full.scheduled_start),
        time: `${formatTime(full.scheduled_start, tz)} – ${formatTime(full.scheduled_end, tz)}`,
        address: `${addr?.address_line1 ?? ""}, ${addr?.city ?? ""}`,
        cancellation_policy: settings2.cancellation_policy ?? undefined,
      },
      contact: {
        email: notifCustomer.email,
        phone: notifCustomer.phone,
        smsConsent: notifCustomer.sms_consent ?? false,
      },
    });
  }

  // Outgoing integration webhooks (Zapier etc.): never breaks booking creation.
  try {
    const { fireIntegrationEvent } = await import("@/lib/integrations/webhooks");
    await fireIntegrationEvent(ctx.company.id, "booking.created", {
      booking_id: booking.id,
      booking_number: bookingRow.booking_number,
      customer_id: full?.customer_id ?? null,
      customer_name: notifCustomer?.name ?? null,
      scheduled_start: full?.scheduled_start ?? null,
      scheduled_end: full?.scheduled_end ?? null,
      recurrence: parsed.data.recurrence,
      jobs: jobs.length,
    });
  } catch {
    // ignore — notifications above already handled customer comms
  }

  redirect(`/dashboard/bookings/${booking.id}`);
}

/** Reschedule: moves the booking and shifts all future jobs by the delta. */
export async function rescheduleBooking(
  id: string,
  newStartInput: string,
  newEndInput: string,
): Promise<ActionResult> {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const t = await getTranslations("bookings");
  const tz = ctx.company.timezone || "America/New_York";
  const newStart = localInputToUtc(newStartInput, tz);
  const newEnd = localInputToUtc(newEndInput, tz);
  if (!(newEnd > newStart)) return { error: t("actions.endAfterStart") };
  // Rescheduling into the past is rejected just like creating in the past.
  if (newStart.getTime() < Date.now() - 60_000) {
    return { error: "The booking start time must be in the future." };
  }

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, scheduled_start")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .single();
  if (!booking) return { error: t("actions.bookingNotFound") };

  const deltaMs = newStart.getTime() - new Date(booking.scheduled_start).getTime();

  const { error: bErr } = await supabase
    .from("bookings")
    .update({ scheduled_start: newStart.toISOString(), scheduled_end: newEnd.toISOString() })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (bErr) return { error: bErr.message };

  // Shift future scheduled jobs (not completed/canceled ones).
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, scheduled_start, scheduled_end, assigned_user_ids")
    .eq("booking_id", id)
    .eq("company_id", ctx.company.id)
    .eq("status", "scheduled")
    .gte("scheduled_start", new Date().toISOString());

  for (const job of jobs ?? []) {
    await supabase
      .from("jobs")
      .update({
        scheduled_start: new Date(new Date(job.scheduled_start).getTime() + deltaMs).toISOString(),
        scheduled_end: new Date(new Date(job.scheduled_end).getTime() + deltaMs).toISOString(),
      })
      .eq("id", job.id);
  }

  // Notify the customer and assigned cleaners about the schedule change.
  const { data: updated } = await supabase
    .from("bookings")
    .select("customer_id, customers(name, email, phone, sms_consent), service_addresses(address_line1, city)")
    .eq("id", id)
    .single();
  const updCustomer = one(updated?.customers) as {
    name: string;
    email: string | null;
    phone: string | null;
    sms_consent: boolean | null;
  } | null;
  const updAddr = one(updated?.service_addresses);
  if (updated && updCustomer) {
    const bUrl = await baseUrl();
    const payload = {
      recipient_name: updCustomer.name,
      company_name: ctx.company.name,
      date: formatDate(newStart.toISOString()),
      time: `${formatTime(newStart.toISOString(), tz)} – ${formatTime(newEnd.toISOString(), tz)}`,
      customer_name: updCustomer.name,
      address: `${updAddr?.address_line1 ?? ""}, ${updAddr?.city ?? ""}`,
      job_link: `${bUrl}/dashboard/bookings/${id}`,
    };
    await enqueueCustomerNotification(supabase, {
      company_id: ctx.company.id,
      recipient_type: "customer",
      recipient_id: updated.customer_id,
      template: "job_updated",
      payload,
      contact: {
        email: updCustomer.email,
        phone: updCustomer.phone,
        smsConsent: updCustomer.sms_consent ?? false,
      },
    });
    const assigneeIds = [
      ...new Set(
        (jobs ?? []).flatMap((j) => (j.assigned_user_ids ?? []) as string[]),
      ),
    ];
    if (assigneeIds.length > 0) {
      const { data: assignees } = await supabase
        .from("memberships")
        .select("user_id, email")
        .eq("company_id", ctx.company.id)
        .in("user_id", assigneeIds);
      for (const a of assignees ?? []) {
        if (!a.email) continue;
        await enqueueCustomerNotification(supabase, {
          company_id: ctx.company.id,
          recipient_type: "user",
          recipient_id: a.user_id,
          template: "job_updated",
          payload,
          contact: { email: a.email },
          skipConsentCheck: true,
        });
      }
    }
  }

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "booking.rescheduled",
    entity_type: "booking",
    entity_id: id,
  });

  revalidatePath(`/dashboard/bookings/${id}`);
  return { ok: true };
}

export async function cancelBooking(id: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const supabase = await createClient();

  const { error: bErr } = await supabase
    .from("bookings")
    .update({ status: "canceled" })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (bErr) return { error: bErr.message };

  const { data: canceledJobs } = await supabase
    .from("jobs")
    .update({ status: "canceled" })
    .eq("booking_id", id)
    .eq("company_id", ctx.company.id)
    .eq("status", "scheduled")
    .gte("scheduled_start", new Date().toISOString())
    .select("id, scheduled_start, scheduled_end, assigned_user_ids, customers(name), service_addresses(address_line1, city)");

  // Tell assigned cleaners their upcoming jobs were cancelled.
  const cancelTz = ctx.company.timezone || "America/New_York";
  const cancelAssigneeIds = [
    ...new Set((canceledJobs ?? []).flatMap((j) => (j.assigned_user_ids ?? []) as string[])),
  ];
  if (cancelAssigneeIds.length > 0) {
    const { data: cancelAssignees } = await supabase
      .from("memberships")
      .select("user_id, email")
      .eq("company_id", ctx.company.id)
      .in("user_id", cancelAssigneeIds);
    const emailByUser = new Map((cancelAssignees ?? []).map((a) => [a.user_id, a.email]));
    for (const j of canceledJobs ?? []) {
      const cName = one(j.customers)?.name ?? "";
      const cAddr = one(j.service_addresses);
      const payload = {
        company_name: ctx.company.name,
        date: formatDate(j.scheduled_start),
        time: `${formatTime(j.scheduled_start, cancelTz)} – ${formatTime(j.scheduled_end, cancelTz)}`,
        customer_name: cName,
        address: `${cAddr?.address_line1 ?? ""}, ${cAddr?.city ?? ""}`,
      };
      for (const uid of (j.assigned_user_ids ?? []) as string[]) {
        const email = emailByUser.get(uid);
        if (!email) continue;
        await enqueueCustomerNotification(supabase, {
          company_id: ctx.company.id,
          recipient_type: "user",
          recipient_id: uid,
          template: "job_cancelled",
          payload,
          contact: { email },
          skipConsentCheck: true,
        });
      }
    }
  }

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "booking.canceled",
    entity_type: "booking",
    entity_id: id,
  });

  // Outgoing integration webhooks (Zapier etc.): never breaks cancellation.
  try {
    const { fireIntegrationEvent } = await import("@/lib/integrations/webhooks");
    await fireIntegrationEvent(ctx.company.id, "booking.cancelled", {
      booking_id: id,
      cancelled_at: new Date().toISOString(),
    });
  } catch {
    // ignore — webhook delivery is best-effort
  }

  revalidatePath(`/dashboard/bookings/${id}`);
  revalidatePath("/dashboard/bookings");
  return { ok: true };
}
