"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth";
import { parseBusinessHours } from "@/lib/front-office/availability";

export type { AiAnsweringSettings } from "@/lib/data/ai-answering-view";

const settingsSchema = z.object({
  ai_answering_enabled: z.boolean(),
  ai_greeting_override: z.string().trim().max(500).default(""),
  ai_model: z.enum(["gpt-4o-mini", "gpt-4o"]),
  owner_phone: z.string().trim().max(32).default(""),
  ai_booking_enabled: z.boolean().default(false),
  ai_slot_minutes: z.number().int().min(15).max(480).default(60),
  ai_buffer_minutes: z.number().int().min(0).max(180).default(15),
  ai_max_days_ahead: z.number().int().min(1).max(60).default(14),
  ai_business_hours: z.record(z.string(), z.unknown()).default({}),
});

/** Owner-only: save AI answering settings. */
export async function saveAiAnsweringSettings(
  input: z.infer<typeof settingsSchema>,
): Promise<{ ok: boolean; error?: string }> {
  const { company } = await requireOwner();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the form and try again." };
  const supabase = await createClient();
  const { ai_business_hours, ...rest } = parsed.data;
  const { error } = await supabase.from("front_office_settings").upsert(
    {
      company_id: company.id,
      plan: "front_desk",
      ...rest,
      ai_business_hours: parseBusinessHours(ai_business_hours),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" },
  );
  if (error) return { ok: false, error: "Couldn't save your AI answering settings." };
  updateTag(`ai-answering:${company.id}`);
  return { ok: true };
}
