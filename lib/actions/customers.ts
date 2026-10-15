"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireCompany } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { customerSchema, addressSchema } from "@/lib/validation";
import { missingColumnName } from "@/lib/supabase/schema-fallback";
import { isQuickBooksConfigured } from "@/lib/quickbooks/config";
import { pushCustomer } from "@/lib/quickbooks/sync";

export type ActionResult = { error?: string; ok?: boolean };

function formToCustomer(formData: FormData) {
  return customerSchema.safeParse({
    name: formData.get("name"),
    customer_type: formData.get("customer_type"),
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    notes: formData.get("notes") || "",
    sms_consent: formData.get("sms_consent") === "on",
  });
}

export async function createCustomer(formData: FormData): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("customers");
  if (!isStaff(ctx.membership.role)) return { error: t("errors.notPermitted") };
  const parsed = formToCustomer(formData);
  if (!parsed.success) return { error: t("errors.checkCustomer") };

  const supabase = await createClient();
  const row = {
    company_id: ctx.company.id,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    notes: parsed.data.notes || null,
    sms_consent: parsed.data.sms_consent,
  };
  let { data, error } = await supabase
    .from("customers")
    .insert({ ...row, customer_type: parsed.data.customer_type })
    .select("id")
    .single();
  if (error && missingColumnName(error) === "customer_type") {
    // DB behind on migration 0008 — save without the type instead of failing.
    ({ data, error } = await supabase
      .from("customers")
      .insert(row)
      .select("id")
      .single());
  }
  if (error || !data) return { error: error?.message ?? t("errors.createFailed") };

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "customer.created",
    entity_type: "customer",
    entity_id: data.id,
  });

  // QuickBooks push (Pro): no-op until QBO is configured; never blocks the save.
  if (isQuickBooksConfigured()) {
    const customerId = data.id;
    pushCustomer(customerId).catch(() => {});
  }

  redirect(`/dashboard/customers/${data.id}`);
}

export async function updateCustomer(id: string, formData: FormData): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("customers");
  if (!isStaff(ctx.membership.role)) return { error: t("errors.notPermitted") };
  const parsed = formToCustomer(formData);
  if (!parsed.success) return { error: t("errors.checkCustomer") };

  const supabase = await createClient();
  const patch = {
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    notes: parsed.data.notes || null,
    sms_consent: parsed.data.sms_consent,
  };
  let { error } = await supabase
    .from("customers")
    .update({ ...patch, customer_type: parsed.data.customer_type })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error && missingColumnName(error) === "customer_type") {
    // DB behind on migration 0008 — save without the type instead of failing.
    ({ error } = await supabase
      .from("customers")
      .update(patch)
      .eq("id", id)
      .eq("company_id", ctx.company.id));
  }
  if (error) return { error: error.message };

  // QuickBooks push (Pro): no-op until QBO is configured; never blocks the save.
  if (isQuickBooksConfigured()) {
    pushCustomer(id).catch(() => {});
  }

  revalidatePath(`/dashboard/customers/${id}`);
  return { ok: true };
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("customers");
  if (!isStaff(ctx.membership.role)) return { error: t("errors.notPermitted") };
  const supabase = await createClient();

  // Don't delete customers with live bookings — cancel those first.
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", id)
    .eq("company_id", ctx.company.id)
    .neq("status", "canceled");
  if ((count ?? 0) > 0) {
    return { error: t("errors.hasActiveBookings") };
  }

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "customer.deleted",
    entity_type: "customer",
    entity_id: id,
  });

  redirect("/dashboard/customers");
}

export async function createAddress(formData: FormData): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("customers");
  if (!isStaff(ctx.membership.role)) return { error: t("errors.notPermitted") };
  const parsed = addressSchema.safeParse({
    customer_id: formData.get("customer_id"),
    label: formData.get("label") || t("addressForm.labelDefault"),
    address_line1: formData.get("address_line1"),
    address_line2: formData.get("address_line2") || "",
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    access_instructions: formData.get("access_instructions") || "",
    is_default: formData.get("is_default") === "on",
  });
  if (!parsed.success) return { error: t("errors.checkAddress") };

  const supabase = await createClient();
  // Verify the customer belongs to this company (RLS would also block it).
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("id", parsed.data.customer_id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!customer) return { error: t("errors.customerNotFound") };

  if (parsed.data.is_default) {
    await supabase
      .from("service_addresses")
      .update({ is_default: false })
      .eq("customer_id", parsed.data.customer_id)
      .eq("company_id", ctx.company.id);
  }

  const { error } = await supabase.from("service_addresses").insert({
    company_id: ctx.company.id,
    customer_id: parsed.data.customer_id,
    label: parsed.data.label,
    address_line1: parsed.data.address_line1,
    address_line2: parsed.data.address_line2 || null,
    city: parsed.data.city,
    state: parsed.data.state,
    zip: parsed.data.zip,
    access_instructions: parsed.data.access_instructions || null,
    is_default: parsed.data.is_default,
  });
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/customers/${parsed.data.customer_id}`);
  return { ok: true };
}

export async function deleteAddress(id: string, customerId: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("customers");
  if (!isStaff(ctx.membership.role)) return { error: t("errors.notPermitted") };
  const supabase = await createClient();

  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("service_address_id", id)
    .eq("company_id", ctx.company.id)
    .neq("status", "canceled");
  if ((count ?? 0) > 0) {
    return { error: t("errors.addressHasActiveBookings") };
  }

  const { error } = await supabase
    .from("service_addresses")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/customers/${customerId}`);
  return { ok: true };
}
