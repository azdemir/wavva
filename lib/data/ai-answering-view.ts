import { cacheLife, cacheTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth";
import { FRONT_OFFICE_PLANS, type FrontOfficePlanId } from "@/lib/front-office";

export type AiAnsweringSettings = {
  ai_answering_enabled: boolean;
  ai_greeting_override: string;
  ai_model: "gpt-4o-mini" | "gpt-4o";
  owner_phone: string;
  business_line: string;
  plan: FrontOfficePlanId;
  ai_booking_enabled: boolean;
  ai_slot_minutes: number;
  ai_buffer_minutes: number;
  ai_max_days_ahead: number;
  ai_business_hours: Record<string, Array<[string, string]>>;
};

export type AiCallView = {
  id: string;
  from_number: string;
  started_at: string;
  duration_seconds: number;
  escalated: boolean;
  outcome: string;
};

export type AiBookingView = {
  id: string;
  caller_name: string;
  caller_phone: string;
  service_name: string;
  starts_at: string;
  ends_at: string;
  status: string;
};

export type AiQuoteView = {
  id: string;
  caller_phone: string;
  service_name: string;
  amount_min_cents: number;
  amount_max_cents: number;
  created_at: string;
};

export type AiAnsweringView = {
  settings: AiAnsweringSettings | null;
  planName: string;
  minutesIncluded: number;
  overagePerMinuteCents: number;
  minutesUsed: number;
  recentCalls: AiCallView[];
  upcomingBookings: AiBookingView[];
  recentQuotes: AiQuoteView[];
  voiceConfigured: boolean;
};

/**
 * Owner-only view data for the AI answering dashboard page.
 * Resolves the company from the session (per-request), then delegates to the
 * cached fetch keyed by company ID — this keeps navigations instant under
 * cacheComponents instead of re-querying on every visit.
 */
export async function getAiAnsweringView(): Promise<AiAnsweringView> {
  const { company } = await requireOwner();
  return getAiAnsweringViewByCompany(company.id);
}

/**
 * Cached per company. Kept unexported so no caller can request another
 * company's data by passing a different ID — the ID always comes from the
 * authenticated session above. The service client bypasses RLS (a cached
 * scope cannot read cookies), so tenant isolation rests on the explicit
 * company_id filters on every query below.
 */
async function getAiAnsweringViewByCompany(companyId: string): Promise<AiAnsweringView> {
  "use cache";
  cacheTag(`ai-answering:${companyId}`);
  cacheLife("minutes");

  const supabase = await createServiceClient();

  const { data } = await supabase
    .from("front_office_settings")
    .select(
      "plan, business_line, ai_answering_enabled, ai_greeting_override, ai_model, owner_phone",
    )
    .eq("company_id", companyId)
    .maybeSingle();

  // Scheduling columns live behind migration 0022 — read them separately so
  // the page keeps working if the owner hasn't run that migration yet.
  let sched: {
    ai_booking_enabled?: boolean;
    ai_slot_minutes?: number;
    ai_buffer_minutes?: number;
    ai_max_days_ahead?: number;
    ai_business_hours?: Record<string, Array<[string, string]>>;
  } = {};
  try {
    const { data: s } = await supabase
      .from("front_office_settings")
      .select(
        "ai_booking_enabled, ai_slot_minutes, ai_buffer_minutes, ai_max_days_ahead, ai_business_hours",
      )
      .eq("company_id", companyId)
      .maybeSingle();
    if (s) sched = s;
  } catch {
    sched = {};
  }

  const planId = (data?.plan === "full_office" ? "full_office" : "front_desk") as FrontOfficePlanId;
  const plan = FRONT_OFFICE_PLANS[planId];

  // Minutes used in the current calendar month.
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { data: calls } = await supabase
    .from("front_office_ai_calls")
    .select("duration_seconds")
    .eq("company_id", companyId)
    .gte("started_at", monthStart.toISOString());
  const minutesUsed = Math.round(
    (calls ?? []).reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / 60,
  );

  const { data: recent } = await supabase
    .from("front_office_ai_calls")
    .select("id, from_number, started_at, duration_seconds, escalated, outcome")
    .eq("company_id", companyId)
    .order("started_at", { ascending: false })
    .limit(20);

  // AI-made bookings + quotes (migration 0022 tables — optional until run).
  let upcomingBookings: AiBookingView[] = [];
  let recentQuotes: AiQuoteView[] = [];
  try {
    const { data: bookings } = await supabase
      .from("front_office_ai_bookings")
      .select("id, caller_name, caller_phone, service_name, starts_at, ends_at, status")
      .eq("company_id", companyId)
      .eq("status", "booked")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(20);
    upcomingBookings = (bookings ?? []) as AiBookingView[];
  } catch {
    upcomingBookings = [];
  }
  try {
    const { data: quotes } = await supabase
      .from("front_office_ai_quotes")
      .select("id, caller_phone, service_name, amount_min_cents, amount_max_cents, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(20);
    recentQuotes = (quotes ?? []) as AiQuoteView[];
  } catch {
    recentQuotes = [];
  }

  return {
    settings: data
      ? {
          ai_answering_enabled: data.ai_answering_enabled ?? true,
          ai_greeting_override: data.ai_greeting_override ?? "",
          ai_model: data.ai_model === "gpt-4o" ? "gpt-4o" : "gpt-4o-mini",
          owner_phone: data.owner_phone ?? "",
          business_line: data.business_line ?? "",
          plan: planId,
          ai_booking_enabled: sched.ai_booking_enabled ?? false,
          ai_slot_minutes: sched.ai_slot_minutes ?? 60,
          ai_buffer_minutes: sched.ai_buffer_minutes ?? 15,
          ai_max_days_ahead: sched.ai_max_days_ahead ?? 14,
          ai_business_hours: sched.ai_business_hours ?? {},
        }
      : null,
    planName: plan.name,
    minutesIncluded: plan.minutesIncluded,
    overagePerMinuteCents: plan.overagePerMinuteCents,
    minutesUsed,
    recentCalls: (recent ?? []) as AiCallView[],
    upcomingBookings,
    recentQuotes,
    voiceConfigured: !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    ),
  };
}
