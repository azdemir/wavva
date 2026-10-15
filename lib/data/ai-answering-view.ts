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
};

export type AiCallView = {
  id: string;
  from_number: string;
  started_at: string;
  duration_seconds: number;
  escalated: boolean;
  outcome: string;
};

export type AiAnsweringView = {
  settings: AiAnsweringSettings | null;
  planName: string;
  minutesIncluded: number;
  overagePerMinuteCents: number;
  minutesUsed: number;
  recentCalls: AiCallView[];
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

  return {
    settings: data
      ? {
          ai_answering_enabled: data.ai_answering_enabled ?? true,
          ai_greeting_override: data.ai_greeting_override ?? "",
          ai_model: data.ai_model === "gpt-4o" ? "gpt-4o" : "gpt-4o-mini",
          owner_phone: data.owner_phone ?? "",
          business_line: data.business_line ?? "",
          plan: planId,
        }
      : null,
    planName: plan.name,
    minutesIncluded: plan.minutesIncluded,
    overagePerMinuteCents: plan.overagePerMinuteCents,
    minutesUsed,
    recentCalls: (recent ?? []) as AiCallView[],
    voiceConfigured: !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    ),
  };
}
