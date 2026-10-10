"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireCompany } from "@/lib/auth";
import { NOT_PERMITTED } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { getTranslations } from "next-intl/server";

export type ActionResult = { error?: string; ok?: boolean; id?: string };
export type TemplateItem = { label: string };
export type ChecklistTemplate = {
  id: string;
  name: string;
  items: TemplateItem[];
};

const itemSchema = z.object({ label: z.string().trim().min(1).max(200) });
const templateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  items: itemSchema.array().max(100),
});

function ownerOnly(role: string) {
  return role === "owner";
}

/** Templates for the booking form's checklist picker (any staff role). */
export async function listChecklistTemplates(): Promise<ChecklistTemplate[]> {
  const ctx = await requireCompany();
  const supabase = await createClient();
  const { data } = await supabase
    .from("checklist_templates")
    .select("id, name, items")
    .eq("company_id", ctx.company.id)
    .order("name");
  return (data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    items: (t.items ?? []) as TemplateItem[],
  }));
}

export async function createChecklistTemplate(input: unknown): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("checklists");
  if (!ownerOnly(ctx.membership.role)) return { error: NOT_PERMITTED };
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t("actions.invalid") };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checklist_templates")
    .insert({
      company_id: ctx.company.id,
      name: parsed.data.name,
      items: parsed.data.items,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? t("actions.createFailed") };

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "checklist_template.created",
    entity_type: "checklist_template",
    entity_id: data.id,
    metadata: { name: parsed.data.name, items: parsed.data.items.length },
  });
  revalidatePath("/dashboard/settings/checklists");
  revalidatePath("/dashboard/bookings/new");
  return { ok: true, id: data.id };
}

export async function updateChecklistTemplate(id: string, input: unknown): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("checklists");
  if (!ownerOnly(ctx.membership.role)) return { error: NOT_PERMITTED };
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t("actions.invalid") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("checklist_templates")
    .update({ name: parsed.data.name, items: parsed.data.items, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "checklist_template.updated",
    entity_type: "checklist_template",
    entity_id: id,
    metadata: { name: parsed.data.name, items: parsed.data.items.length },
  });
  revalidatePath("/dashboard/settings/checklists");
  revalidatePath("/dashboard/bookings/new");
  return { ok: true };
}

export async function deleteChecklistTemplate(id: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  if (!ownerOnly(ctx.membership.role)) return { error: NOT_PERMITTED };

  const supabase = await createClient();
  // Bookings keep their seeded visit checklists; only the link is cleared
  // (the FK uses ON DELETE SET NULL).
  const { error } = await supabase
    .from("checklist_templates")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "checklist_template.deleted",
    entity_type: "checklist_template",
    entity_id: id,
  });
  revalidatePath("/dashboard/settings/checklists");
  revalidatePath("/dashboard/bookings/new");
  return { ok: true };
}
