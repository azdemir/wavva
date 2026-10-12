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

/**
 * Reject an email already used by another customer in this company.
 *
 * `customers` has no unique constraint on (company_id, email) — the
 * `unique (company_id, email)` in 0001_init.sql belongs to `invites` — so
 * without this the manual form silently creates duplicate customer records.
 * The CSV importer has its own dedupe pass; this covers the UI path.
 *
 * `excludeId` lets an edit keep its own email without tripping the check.
 * Comparison is case-insensitive, matching how the importer normalizes.
 */
async function checkDuplicateEmail(
  companyId: string,
  email: string | null,
  excludeId?: string,
): Promise<{ error: string } | null> {
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return null; // Emails are optional.

  const supabase = await createClient();
  // Escape LIKE metacharacters — "_" and "%" are common in real addresses
  // (john_doe@…, 100%clean@…) and would otherwise match other customers.
  const pattern = normalized.replace(/([\\%_])/g, "\\$1");
  const { data: existing } = await supabase
    .from("customers")
    .select("id, name, email")
    .eq("company_id", companyId)
    .ilike("email", pattern);

  const clash = (existing ?? []).find((c) => c.id !== excludeId);
  if (!clash) return null;
  return {
    error: `That email is already used by ${clash.name}. Open that customer instead of creating a duplicate.`,
  };
}

export async function createCustomer(formData: FormData): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("customers");
  if (!isStaff(ctx.membership.role)) return { error: t("errors.notPermitted") };
  const parsed = formToCustomer(formData);
  if (!parsed.success) return { error: t("errors.checkCustomer") };

  const duplicate = await checkDuplicateEmail(ctx.company.id, parsed.data.email || null);
  if (duplicate) return duplicate;

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

  redirect(`/dashboard/customers/${data.id}`);
}

export async function updateCustomer(id: string, formData: FormData): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("customers");
  if (!isStaff(ctx.membership.role)) return { error: t("errors.notPermitted") };
  const parsed = formToCustomer(formData);
  if (!parsed.success) return { error: t("errors.checkCustomer") };

  // Exclude this customer so saving without changing the email still works.
  const duplicate = await checkDuplicateEmail(
    ctx.company.id,
    parsed.data.email || null,
    id,
  );
  if (duplicate) return duplicate;

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
