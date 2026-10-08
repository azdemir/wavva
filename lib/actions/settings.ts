"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { settingsSchema } from "@/lib/validation";

export async function updateCompanySettings(formData: FormData) {
  const ctx = await requireOwner();
  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    website: formData.get("website") || "",
    timezone: formData.get("timezone"),
    default_tax_rate: formData.get("default_tax_rate"),
    cancellation_policy: formData.get("cancellation_policy") || "",
    freq_weekly: formData.get("freq_weekly"),
    freq_biweekly: formData.get("freq_biweekly"),
    freq_monthly: formData.get("freq_monthly"),
    followup_enabled: formData.get("followup_enabled"),
    followup_days: formData.get("followup_days"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();

  // Parse "2, 5" into [2, 5] (max 3 touches, 1–30 days each).
  const followupDays = String(parsed.data.followup_days ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0 && n <= 30)
    .slice(0, 3)
    .sort((a, b) => a - b);

  // Merge into existing settings so unrelated keys are never wiped.
  const { data: current } = await supabase
    .from("companies")
    .select("settings")
    .eq("id", ctx.company.id)
    .single();
  const prev = (current?.settings ?? {}) as Record<string, unknown>;

  const { error } = await supabase
    .from("companies")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
      timezone: parsed.data.timezone,
      settings: {
        ...prev,
        default_tax_rate: parsed.data.default_tax_rate,
        cancellation_policy: parsed.data.cancellation_policy || null,
        frequency_multipliers: {
          weekly: parsed.data.freq_weekly,
          biweekly: parsed.data.freq_biweekly,
          monthly: parsed.data.freq_monthly,
        },
        followup_enabled: parsed.data.followup_enabled,
        followup_days: followupDays.length > 0 ? followupDays : [2, 5],
      },
    })
    .eq("id", ctx.company.id);
  if (error) return { error: error.message };

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "company.settings_updated",
    entity_type: "company",
    entity_id: ctx.company.id,
  });

  revalidatePath("/dashboard/settings");
  return { ok: true };
}
