"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompany } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { quoteSchema } from "@/lib/validation";
import { computeTotals, nextNumber } from "@/lib/pricing";
import { one } from "@/lib/relations";
import { baseUrl } from "@/lib/base-url";
import { formatDate } from "@/lib/format";
import { enqueueNotification } from "@/lib/notifications/queue";
import { getOrCreatePortalLink } from "@/lib/actions/portal";
import { scheduleQuoteFollowups, cancelQuoteFollowups } from "@/lib/followups";

export type ActionResult = { error?: string; ok?: boolean };

const transitions: Record<string, string[]> = {
  draft: ["sent", "expired"],
  sent: ["approved", "declined", "expired"],
  approved: [],
  declined: [],
  expired: [],
};

export async function createQuote(input: unknown): Promise<ActionResult> {
  const ctx = await requireCompany();
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid quote." };
  }

  const supabase = await createClient();

  // Customer must belong to this company.
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("id", parsed.data.customer_id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!customer) return { error: "Customer not found." };

  const totals = computeTotals(
    parsed.data.items,
    parsed.data.discount_cents,
    parsed.data.tax_rate,
  );

  const { count } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("company_id", ctx.company.id);

  const { data: quote, error: qErr } = await supabase
    .from("quotes")
    .insert({
      company_id: ctx.company.id,
      customer_id: parsed.data.customer_id,
      quote_number: nextNumber("Q", count ?? 0),
      status: "draft",
      subtotal_cents: totals.subtotal,
      discount_cents: totals.discount,
      tax_rate: parsed.data.tax_rate,
      tax_cents: totals.tax,
      total_cents: totals.total,
      valid_until: parsed.data.valid_until || null,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();
  if (qErr || !quote) {
    return { error: qErr?.message ?? "Could not create quote." };
  }

  const { error: iErr } = await supabase.from("quote_line_items").insert(
    parsed.data.items.map((item, i) => ({
      company_id: ctx.company.id,
      quote_id: quote.id,
      kind: item.kind,
      ref_id: item.ref_id || null,
      label: item.label,
      qty: item.qty,
      unit_price_cents: item.unit_price_cents,
      line_total_cents: Math.round(item.qty * item.unit_price_cents),
      sort: i,
    })),
  );
  if (iErr) {
    await supabase.from("quotes").delete().eq("id", quote.id);
    return { error: iErr.message };
  }

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "quote.created",
    entity_type: "quote",
    entity_id: quote.id,
    metadata: { total_cents: totals.total },
  });

  redirect(`/dashboard/quotes/${quote.id}`);
}

export async function setQuoteStatus(id: string, status: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, status")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .single();
  if (!quote) return { error: "Quote not found." };

  const allowed = transitions[quote.status] ?? [];
  if (!allowed.includes(status)) {
    return { error: `Can't move a ${quote.status} quote to ${status}.` };
  }

  const { error } = await supabase
    .from("quotes")
    .update({ status })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: `quote.${status}`,
    entity_type: "quote",
    entity_id: id,
  });

  if (status === "sent") {
    await scheduleQuoteFollowups(supabase, ctx.company.id, id);
    const { data: full } = await supabase
      .from("quotes")
      .select("quote_number, total_cents, valid_until, customer_id, customers(name, email)")
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
        template: "quote_sent",
        payload: {
          email: customer.email,
          recipient_name: customer.name,
          company_name: ctx.company.name,
          quote_number: full.quote_number,
          total_cents: full.total_cents,
          valid_until: full.valid_until ? formatDate(full.valid_until) : undefined,
          portal_link: portal.link,
        },
      });
    }
  }

  if (status === "approved" || status === "declined" || status === "expired") {
    await cancelQuoteFollowups(supabase, id);
  }

  revalidatePath(`/dashboard/quotes/${id}`);
  revalidatePath("/dashboard/quotes");
  return { ok: true };
}

export async function deleteQuote(id: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, status")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .single();
  if (!quote) return { error: "Quote not found." };
  if (quote.status !== "draft") {
    return { error: "Only draft quotes can be deleted." };
  }

  const { error } = await supabase
    .from("quotes")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };

  redirect("/dashboard/quotes");
}
