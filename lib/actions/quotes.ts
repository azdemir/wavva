"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireCompany } from "@/lib/auth";
import { isStaff, NOT_PERMITTED } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { quoteSchema } from "@/lib/validation";
import { computeTotals, nextNumber } from "@/lib/pricing";
import { one } from "@/lib/relations";
import { baseUrl } from "@/lib/base-url";
import { formatDate } from "@/lib/format";
import { enqueueCustomerNotification } from "@/lib/communications/notify";
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
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const t = await getTranslations("quotes");
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("actions.invalid") };
  }

  const supabase = await createClient();

  // Customer check and the numbering count are independent — run together.
  const [{ data: customer }, { count }] = await Promise.all([
    supabase
      .from("customers")
      .select("id")
      .eq("id", parsed.data.customer_id)
      .eq("company_id", ctx.company.id)
      .maybeSingle(),
    supabase
      .from("quotes")
      .select("id", { count: "exact", head: true })
      .eq("company_id", ctx.company.id),
  ]);
  if (!customer) return { error: t("actions.customerNotFound") };

  const totals = computeTotals(
    parsed.data.items,
    parsed.data.discount_cents,
    parsed.data.tax_rate,
  );

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
    return { error: qErr?.message ?? t("actions.createFailed") };
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
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const t = await getTranslations("quotes");
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, status")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .single();
  if (!quote) return { error: t("actions.notFound") };

  const allowed = transitions[quote.status] ?? [];
  if (!allowed.includes(status)) {
    return {
      error: t("actions.invalidTransition", {
        from: t(`status.${quote.status}`),
        to: t(`status.${status}`),
      }),
    };
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
      .select("quote_number, total_cents, valid_until, customer_id, customers(name, email, phone, sms_consent)")
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
        template: "quote_sent",
        payload: {
          recipient_name: customer.name,
          company_name: ctx.company.name,
          quote_number: full.quote_number,
          total_cents: full.total_cents,
          valid_until: full.valid_until ? formatDate(full.valid_until) : undefined,
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

  if (status === "approved") {
    const { data: full } = await supabase
      .from("quotes")
      .select("quote_number, customer_id, customers(name, email, phone, sms_consent)")
      .eq("id", id)
      .single();
    const customer = one(full?.customers) as {
      name: string;
      email: string | null;
      phone: string | null;
      sms_consent: boolean | null;
    } | null;
    if (full && customer) {
      await enqueueCustomerNotification(supabase, {
        company_id: ctx.company.id,
        recipient_type: "customer",
        recipient_id: full.customer_id,
        template: "quote_approved",
        payload: {
          recipient_name: customer.name,
          company_name: ctx.company.name,
          quote_number: full.quote_number,
        },
        contact: {
          email: customer.email,
          phone: customer.phone,
          smsConsent: customer.sms_consent ?? false,
        },
      });
      // Outgoing integration webhooks (Zapier etc.): never breaks approval.
      try {
        const { fireIntegrationEvent } = await import("@/lib/integrations/webhooks");
        await fireIntegrationEvent(ctx.company.id, "quote.approved", {
          quote_id: id,
          quote_number: full.quote_number,
          customer_id: full.customer_id,
          customer_name: customer.name,
          approved_at: new Date().toISOString(),
        });
      } catch {
        // ignore — webhook delivery is best-effort
      }
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
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const t = await getTranslations("quotes");
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, status")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .single();
  if (!quote) return { error: t("actions.notFound") };
  if (quote.status !== "draft") {
    return { error: t("actions.onlyDraftDeletable") };
  }

  const { error } = await supabase
    .from("quotes")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };

  redirect("/dashboard/quotes");
}
