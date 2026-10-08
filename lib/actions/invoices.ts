"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireCompany } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { computeTotals, nextNumber } from "@/lib/pricing";
import { one } from "@/lib/relations";
import { baseUrl } from "@/lib/base-url";
import { formatDate } from "@/lib/format";
import { enqueueNotification } from "@/lib/notifications/queue";
import { getOrCreatePortalLink } from "@/lib/actions/portal";

export type ActionResult = { error?: string; ok?: boolean };

const lineSchema = z.object({
  label: z.string().min(1).max(200),
  qty: z.coerce.number().positive(),
  unit_price_cents: z.coerce.number().int().min(0),
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
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid invoice." };
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
  if (!customer) return { error: "Customer not found." };

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
  if (iErr || !invoice) return { error: iErr?.message ?? "Could not create invoice." };

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
  paid: [],
  void: [],
};

export async function setInvoiceStatus(id: string, status: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .single();
  if (!invoice) return { error: "Invoice not found." };
  if (!(invoiceTransitions[invoice.status] ?? []).includes(status)) {
    return { error: `Can't move a ${invoice.status} invoice to ${status}.` };
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
      .select("invoice_number, total_cents, due_date, customer_id, customers(name, email)")
      .eq("id", id)
      .single();
    const customer = one(full?.customers);
    if (full && customer?.email) {
      const bUrl = await baseUrl();
      const portal = await getOrCreatePortalLink(full.customer_id, bUrl);
      await enqueueNotification(supabase, {
        company_id: ctx.company.id,
        recipient_type: "customer",
        recipient_id: full.customer_id,
        channel: "email",
        template: "invoice_sent",
        payload: {
          email: customer.email,
          recipient_name: customer.name,
          company_name: ctx.company.name,
          invoice_number: full.invoice_number,
          total_cents: full.total_cents,
          due_date: full.due_date ? formatDate(full.due_date) : undefined,
          portal_link: portal.link,
        },
      });
    }
  }

  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Record an offline payment (cash, check, bank transfer). */
export async function recordPayment(id: string, formData: FormData): Promise<ActionResult> {
  const ctx = await requireCompany();
  const amountCents = Math.round(Number(formData.get("amount") || 0) * 100);
  if (!(amountCents > 0)) return { error: "Enter a payment amount." };

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status, total_cents, amount_paid_cents")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .single();
  if (!invoice) return { error: "Invoice not found." };
  if (!["sent", "overdue"].includes(invoice.status)) {
    return { error: "Payments can only be recorded on sent invoices." };
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

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "invoice.payment_recorded",
    entity_type: "invoice",
    entity_id: id,
    metadata: { amount_cents: amountCents },
  });

  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard/invoices");
  return { ok: true };
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .single();
  if (!invoice) return { error: "Invoice not found." };
  if (invoice.status !== "draft") return { error: "Only draft invoices can be deleted." };

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };

  redirect("/dashboard/invoices");
}
