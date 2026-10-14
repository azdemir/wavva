"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
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

/** Owner-only: AI answering settings, this month's minute usage, recent calls. */
export async function getAiAnsweringView(): Promise<AiAnsweringView> {
  const { company } = await requireOwner();
  const supabase = await createClient();

  const { data } = await supabase
    .from("front_office_settings")
    .select(
      "plan, business_line, ai_answering_enabled, ai_greeting_override, ai_model, owner_phone",
    )
    .eq("company_id", company.id)
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
    .eq("company_id", company.id)
    .gte("started_at", monthStart.toISOString());
  const minutesUsed = Math.round(
    (calls ?? []).reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / 60,
  );

  const { data: recent } = await supabase
    .from("front_office_ai_calls")
    .select("id, from_number, started_at, duration_seconds, escalated, outcome")
    .eq("company_id", company.id)
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

const settingsSchema = z.object({
  ai_answering_enabled: z.boolean(),
  ai_greeting_override: z.string().trim().max(500).default(""),
  ai_model: z.enum(["gpt-4o-mini", "gpt-4o"]),
  owner_phone: z.string().trim().max(32).default(""),
});

/** Owner-only: save AI answering settings. */
export async function saveAiAnsweringSettings(
  input: z.infer<typeof settingsSchema>,
): Promise<{ ok: boolean; error?: string }> {
  const { company } = await requireOwner();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the form and try again." };
  const supabase = await createClient();
  const { error } = await supabase.from("front_office_settings").upsert(
    {
      company_id: company.id,
      plan: "front_desk",
      ...parsed.data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" },
  );
  if (error) return { ok: false, error: "Couldn't save your AI answering settings." };
  revalidatePath("/dashboard/front-office/ai-answering");
  return { ok: true };
}
