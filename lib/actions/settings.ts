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
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
      timezone: parsed.data.timezone,
      settings: {
        default_tax_rate: parsed.data.default_tax_rate,
        cancellation_policy: parsed.data.cancellation_policy || null,
        frequency_multipliers: {
          weekly: parsed.data.freq_weekly,
          biweekly: parsed.data.freq_biweekly,
          monthly: parsed.data.freq_monthly,
        },
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
