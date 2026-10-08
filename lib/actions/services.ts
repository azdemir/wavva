"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompany } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { serviceSchema, addonSchema } from "@/lib/validation";

export type ActionResult = { error?: string; ok?: boolean };
const PATH = "/dashboard/services";

function dollarsToCents(v: FormDataEntryValue | null): number {
  return Math.round(Number(v || 0) * 100);
}

export async function createService(formData: FormData): Promise<ActionResult> {
  const ctx = await requireCompany();
  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description") || "",
    base_price_cents: dollarsToCents(formData.get("price")),
    unit: formData.get("unit"),
  });
  if (!parsed.success) return { error: "Please check the service details." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .insert({
      company_id: ctx.company.id,
      name: parsed.data.name,
      category: parsed.data.category,
      description: parsed.data.description || null,
      base_price_cents: parsed.data.base_price_cents,
      unit: parsed.data.unit,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not create service." };

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "service.created",
    entity_type: "service",
    entity_id: data.id,
  });
  revalidatePath(PATH);
  return { ok: true };
}

export async function updateService(id: string, formData: FormData): Promise<ActionResult> {
  const ctx = await requireCompany();
  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description") || "",
    base_price_cents: dollarsToCents(formData.get("price")),
    unit: formData.get("unit"),
  });
  if (!parsed.success) return { error: "Please check the service details." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({
      name: parsed.data.name,
      category: parsed.data.category,
      description: parsed.data.description || null,
      base_price_cents: parsed.data.base_price_cents,
      unit: parsed.data.unit,
    })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function setServiceActive(id: string, active: boolean): Promise<ActionResult> {
  const ctx = await requireCompany();
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ is_active: active })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteService(id: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  const supabase = await createClient();

  const [{ count: quoteRefs }, { count: bookingRefs }] = await Promise.all([
    supabase.from("quote_line_items").select("id", { count: "exact", head: true }).eq("ref_id", id),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("service_id", id),
  ]);
  if ((quoteRefs ?? 0) > 0 || (bookingRefs ?? 0) > 0) {
    return {
      error:
        "This service is used on quotes or bookings. Deactivate it instead of deleting.",
    };
  }

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function createAddon(formData: FormData): Promise<ActionResult> {
  const ctx = await requireCompany();
  const parsed = addonSchema.safeParse({
    name: formData.get("name"),
    price_cents: dollarsToCents(formData.get("price")),
  });
  if (!parsed.success) return { error: "Please check the add-on details." };

  const supabase = await createClient();
  const { error } = await supabase.from("addons").insert({
    company_id: ctx.company.id,
    name: parsed.data.name,
    price_cents: parsed.data.price_cents,
  });
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function updateAddon(id: string, formData: FormData): Promise<ActionResult> {
  const ctx = await requireCompany();
  const parsed = addonSchema.safeParse({
    name: formData.get("name"),
    price_cents: dollarsToCents(formData.get("price")),
  });
  if (!parsed.success) return { error: "Please check the add-on details." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("addons")
    .update({ name: parsed.data.name, price_cents: parsed.data.price_cents })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function setAddonActive(id: string, active: boolean): Promise<ActionResult> {
  const ctx = await requireCompany();
  const supabase = await createClient();
  const { error } = await supabase
    .from("addons")
    .update({ is_active: active })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteAddon(id: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  const supabase = await createClient();

  const { count } = await supabase
    .from("quote_line_items")
    .select("id", { count: "exact", head: true })
    .eq("ref_id", id);
  if ((count ?? 0) > 0) {
    return { error: "This add-on is used on quotes. Deactivate it instead." };
  }

  const { error } = await supabase
    .from("addons")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}
