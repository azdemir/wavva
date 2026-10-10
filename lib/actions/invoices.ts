"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireCompany } from "@/lib/auth";
import { isStaff, NOT_PERMITTED } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { computeTotals, nextNumber } from "@/lib/pricing";
import { one } from "@/lib/relations";
import { baseUrl } from "@/lib/base-url";
import { formatDate } from "@/lib/format";
import { enqueueCustomerNotification } from "@/lib/communications/notify";
import { getOrCreatePortalLink } from "@/lib/actions/portal";
import { getTranslations } from "next-intl/server";
import { isQuickBooksConfigured } from "@/lib/quickbooks/config";
import { pushInvoice } from "@/lib/quickbooks/sync";

export type ActionResult = { error?: string; ok?: boolean };

const lineSchema = z.object({
  label: z.string().min(1, "Enter a description for each line item.").max(200),
  qty: z.coerce.number().positive("Quantity must be more than 0."),
  unit_price_cents: z.coerce
    .number()
    .int("Enter a whole number of cents.")
    .min(0, "Enter an amount of 0 or more."),
});

const invoiceSchema = z.object({
  customer_id: z.string().uuid(),
  booking_id: z.string().uuid().optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  tax_rate: z.coerce.number().min(0).max(1).default(0),
  items: z.array(lineSchema).min(1, "Add at least one line item"),
});

export async function createInvoice(input: unknown): Promise<ActionResult> {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const t = await getTranslations("invoices");
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("errors.invalidInvoice") };
  }

  // Customer check and the numbering count are independent — run together.
  const supabase = await createClient();
  const [{ data: customer }, { count }] = await Promise.all([
    supabase
      .from("customers")
      .select("id")
      .eq("id", parsed.data.customer_id)
      .eq("company_id", ctx.company.id)
      .maybeSingle(),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("company_id", ctx.company.id),
  ]);
  if (!customer) return { error: t("errors.customerNotFound") };

  const totals = computeTotals(parsed.data.items, 0, parsed.data.tax_rate);

  const { data: invoice, error: iErr } = await supabase
    .from("invoices")
    .insert({
      company_id: ctx.company.id,
      customer_id: customer.id,
      booking_id: parsed.data.booking_id || null,
      invoice_number: nextNumber("I", count ?? 0),
      status: "draft",
      subtotal_cents: totals.subtotal,
      tax_rate: parsed.data.tax_rate,
      tax_cents: totals.tax,
      total_cents: totals.total,
      due_date: parsed.data.due_date || null,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();
  if (iErr || !invoice) return { error: iErr?.message ?? t("errors.couldNotCreate") };

  const { error: lErr } = await supabase.from("invoice_line_items").insert(
    parsed.data.items.map((item, i) => ({
      company_id: ctx.company.id,
      invoice_id: invoice.id,
      label: item.label,
      qty: item.qty,
      unit_price_cents: item.unit_price_cents,
      line_total_cents: Math.round(item.qty * item.unit_price_cents),
      sort: i,
    })),
  );
  if (lErr) {
    await supabase.from("invoices").delete().eq("id", invoice.id);
    return { error: lErr.message };
  }

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "invoice.created",
    entity_type: "invoice",
    entity_id: invoice.id,
    metadata: { total_cents: totals.total },
  });

  redirect(`/dashboard/invoices/${invoice.id}`);
}

const invoiceTransitions: Record<string, string[]> = {
  draft: ["sent", "void"],
  sent: ["paid", "overdue", "void"],
  overdue: ["paid", "void"],
  // A paid invoice can only be voided — the record (and its payments) are
  // kept for the books; voiding never deletes anything.
  paid: ["void"],
  void: [],
};

export async function setInvoiceStatus(id: string, status: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const t = await getTranslations("invoices");
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .single();
  if (!invoice) return { error: t("errors.invoiceNotFound") };
  if (!(invoiceTransitions[invoice.status] ?? []).includes(status)) {
    const trStatus = (s: string) =>
      (["draft", "sent", "overdue", "paid", "void"] as readonly string[]).includes(s)
        ? t(`list.status.${s}`)
        : s;
    return { error: t("errors.invalidTransition", { from: trStatus(invoice.status), to: trStatus(status) }) };
  }

  const { error } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: `invoice.${status}`,
    entity_type: "invoice",
    entity_id: id,
  });

  if (status === "sent") {
    const { data: full } = await supabase
      .from("invoices")
      .select("invoice_number, total_cents, due_date, customer_id, customers(name, email, phone, sms_consent)")
      .eq("id", id)
      .single();
    const customer = one(full?.customers) as {
      name: string;
      email: string | null;
      phone: string | null;
      sms_consent: boolean | null;
    } | null;
    if (full && customer) {
      const bUrl = await baseUrl();
      const portal = await getOrCreatePortalLink(full.customer_id, bUrl);
      await enqueueCustomerNotification(supabase, {
        company_id: ctx.company.id,
        recipient_type: "customer",
        recipient_id: full.customer_id,
        template: "invoice_sent",
        payload: {
          recipient_name: customer.name,
          company_name: ctx.company.name,
          invoice_number: full.invoice_number,
          total_cents: full.total_cents,
          due_date: full.due_date ? formatDate(full.due_date) : undefined,
          portal_link: portal.link,
        },
        contact: {
          email: customer.email,
          phone: customer.phone,
          smsConsent: customer.sms_consent ?? false,
        },
      });
    }
  }

  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard");

  // QuickBooks push (Pro): no-op until QBO is configured; never blocks the save.
  if (status !== "draft" && isQuickBooksConfigured()) {
    pushInvoice(id).catch(() => {});
  }

  return { ok: true };
}

/** Record an offline payment (cash, check, bank transfer). */
export async function recordPayment(id: string, formData: FormData): Promise<ActionResult> {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const t = await getTranslations("invoices");
  const amountCents = Math.round(Number(formData.get("amount") || 0) * 100);
  if (!(amountCents > 0)) return { error: t("errors.enterPaymentAmount") };

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status, total_cents, amount_paid_cents")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .single();
  if (!invoice) return { error: t("errors.invoiceNotFound") };
  if (!["sent", "overdue"].includes(invoice.status)) {
    return { error: t("errors.paymentsOnlyOnSent") };
  }

  const { error: pErr } = await supabase.from("payments").insert({
    company_id: ctx.company.id,
    invoice_id: id,
    amount_cents: amountCents,
    status: "succeeded",
    provider: "manual",
    provider_ref: String(formData.get("reference") || "") || null,
  });
  if (pErr) return { error: pErr.message };

  const paid = invoice.amount_paid_cents + amountCents;
  const { error: iErr } = await supabase
    .from("invoices")
    .update({
      amount_paid_cents: paid,
      status: paid >= invoice.total_cents ? "paid" : invoice.status,
    })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (iErr) return { error: iErr.message };

  // Outgoing integration webhooks (Zapier etc.): never breaks payment recording.
  if (paid >= invoice.total_cents && invoice.status !== "paid") {
    try {
      const { fireIntegrationEvent } = await import("@/lib/integrations/webhooks");
      await fireIntegrationEvent(ctx.company.id, "invoice.paid", {
        invoice_id: id,
        amount_cents: paid,
        provider: "manual",
      });
    } catch {
      // ignore — webhook delivery is best-effort
    }
  }

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "invoice.payment_recorded",
    entity_type: "invoice",
    entity_id: id,
    metadata: { amount_cents: amountCents },
  });

  // Thank the customer for the payment (email + SMS when consented).
  const { data: paidInvoice } = await supabase
    .from("invoices")
    .select("invoice_number, customer_id, customers(name, email, phone, sms_consent)")
    .eq("id", id)
    .single();
  const paidCustomer = one(paidInvoice?.customers) as {
    name: string;
    email: string | null;
    phone: string | null;
    sms_consent: boolean | null;
  } | null;
  if (paidInvoice && paidCustomer) {
    await enqueueCustomerNotification(supabase, {
      company_id: ctx.company.id,
      recipient_type: "customer",
      recipient_id: paidInvoice.customer_id,
      template: "payment_received",
      payload: {
        recipient_name: paidCustomer.name,
        company_name: ctx.company.name,
        amount_cents: amountCents,
        invoice_number: paidInvoice.invoice_number,
      },
      contact: {
        email: paidCustomer.email,
        phone: paidCustomer.phone,
        smsConsent: paidCustomer.sms_consent ?? false,
      },
    });
  }

  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard/invoices");
  return { ok: true };
}

/**
 * Mark an invoice paid in full. Unlike setInvoiceStatus(id, "paid") — which
 * only flips the status — this records a manual payment for the remaining
 * balance first, so "Paid $X / Balance due $0.00" stays truthful. Mirrors the
 * Stripe webhook's payment recording with provider "manual".
 */
export async function markInvoicePaid(id: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const t = await getTranslations("invoices");
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status, total_cents, amount_paid_cents")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .single();
  if (!invoice) return { error: t("errors.invoiceNotFound") };
  if (!["sent", "overdue"].includes(invoice.status)) {
    return { error: t("errors.paymentsOnlyOnSent") };
  }
  const dueCents = invoice.total_cents - invoice.amount_paid_cents;
  if (dueCents <= 0) {
    // Nothing left to record — just flip the status.
    return setInvoiceStatus(id, "paid");
  }
  // Delegate to recordPayment so the payment row, audit log, webhook event,
  // and customer "payment received" notification all stay in one code path.
  const formData = new FormData();
  formData.set("amount", (dueCents / 100).toFixed(2));
  formData.set("reference", "");
  return recordPayment(id, formData);
}

const invoiceNumberSchema = z.string().trim().min(1, "Enter an invoice number.").max(50);

/** Rename an invoice (the invoice_number must stay unique per company). */
export async function updateInvoiceNumber(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const t = await getTranslations("invoices");
  const parsed = invoiceNumberSchema.safeParse(formData.get("invoice_number"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("errors.invalidInvoiceNumber") };
  }
  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .single();
  if (!invoice) return { error: t("errors.invoiceNotFound") };

  const { error } = await supabase
    .from("invoices")
    .update({ invoice_number: parsed.data })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) {
    if (error.code === "23505") return { error: t("errors.numberAlreadyUsed") };
    return { error: error.message };
  }

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "invoice.number_changed",
    entity_type: "invoice",
    entity_id: id,
    metadata: { invoice_number: parsed.data },
  });
  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard/invoices");
  return { ok: true };
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const t = await getTranslations("invoices");
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .single();
  if (!invoice) return { error: t("errors.invoiceNotFound") };
  if (invoice.status !== "draft") return { error: t("errors.onlyDraftDeletable") };

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };

  redirect("/dashboard/invoices");
}
