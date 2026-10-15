"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth";

export type { AiAnsweringSettings } from "@/lib/data/ai-answering-view";

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
  updateTag(`ai-answering:${company.id}`);
  return { ok: true };
}
