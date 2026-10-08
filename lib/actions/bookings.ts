"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompany } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { bookingSchema } from "@/lib/validation";
import { localInputToUtc } from "@/lib/dates";
import { nextNumber } from "@/lib/pricing";

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
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid booking." };
  }
  const tz = ctx.company.timezone || "America/New_York";
  const start = localInputToUtc(parsed.data.scheduled_start, tz);
  const end = localInputToUtc(parsed.data.scheduled_end, tz);
  if (!(end > start)) return { error: "End time must be after start time." };

  const supabase = await createClient();

  // Verify all references belong to this company.
  const [{ data: customer }, { data: address }] = await Promise.all([
    supabase.from("customers").select("id").eq("id", parsed.data.customer_id).eq("company_id", ctx.company.id).maybeSingle(),
    supabase.from("service_addresses").select("id, customer_id").eq("id", parsed.data.service_address_id).eq("company_id", ctx.company.id).maybeSingle(),
  ]);
  if (!customer) return { error: "Customer not found." };
  if (!address || address.customer_id !== customer.id) {
    return { error: "Service address doesn't belong to this customer." };
  }
  if (parsed.data.service_id) {
    const { data: svc } = await supabase.from("services").select("id").eq("id", parsed.data.service_id).eq("company_id", ctx.company.id).maybeSingle();
    if (!svc) return { error: "Service not found." };
  }
  if (parsed.data.quote_id) {
    const { data: q } = await supabase.from("quotes").select("id").eq("id", parsed.data.quote_id).eq("company_id", ctx.company.id).maybeSingle();
    if (!q) return { error: "Quote not found." };
  }

  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("company_id", ctx.company.id);

  const settings = ctx.company.settings as { cancellation_policy?: string | null };
  const { data: booking, error: bErr } = await supabase
    .from("bookings")
    .insert({
      company_id: ctx.company.id,
      customer_id: customer.id,
      service_address_id: address.id,
      service_id: parsed.data.service_id || null,
      quote_id: parsed.data.quote_id || null,
      booking_number: nextNumber("B", count ?? 0),
      recurrence: parsed.data.recurrence,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      cancellation_policy: settings.cancellation_policy ?? null,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();
  if (bErr || !booking) return { error: bErr?.message ?? "Could not create booking." };

  const jobs = occurrences(start, end, parsed.data.recurrence).map((o) => ({
    company_id: ctx.company.id,
    booking_id: booking.id,
    customer_id: customer.id,
    service_address_id: address.id,
    scheduled_start: o.start.toISOString(),
    scheduled_end: o.end.toISOString(),
    status: "scheduled",
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

  redirect(`/dashboard/bookings/${booking.id}`);
}

/** Reschedule: moves the booking and shifts all future jobs by the delta. */
export async function rescheduleBooking(
  id: string,
  newStartInput: string,
  newEndInput: string,
): Promise<ActionResult> {
  const ctx = await requireCompany();
  const tz = ctx.company.timezone || "America/New_York";
  const newStart = localInputToUtc(newStartInput, tz);
  const newEnd = localInputToUtc(newEndInput, tz);
  if (!(newEnd > newStart)) return { error: "End time must be after start time." };

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, scheduled_start")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .single();
  if (!booking) return { error: "Booking not found." };

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
    .select("id, scheduled_start, scheduled_end")
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
  const supabase = await createClient();

  const { error: bErr } = await supabase
    .from("bookings")
    .update({ status: "canceled" })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (bErr) return { error: bErr.message };

  await supabase
    .from("jobs")
    .update({ status: "canceled" })
    .eq("booking_id", id)
    .eq("company_id", ctx.company.id)
    .eq("status", "scheduled")
    .gte("scheduled_start", new Date().toISOString());

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "booking.canceled",
    entity_type: "booking",
    entity_id: id,
  });

  revalidatePath(`/dashboard/bookings/${id}`);
  revalidatePath("/dashboard/bookings");
  return { ok: true };
}
