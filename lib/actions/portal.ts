"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireCompany } from "@/lib/auth";
import { isStaff, NOT_PERMITTED } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { getStripe } from "@/lib/stripe";
import { getPortalContext } from "@/lib/portal";

/** Company member: get (or create) the customer's portal link. */
export async function getOrCreatePortalLink(
  customerId: string,
  baseUrl: string,
): Promise<{ error?: string; link?: string }> {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!customer) return { error: "Customer not found." };

  const { data: tokens } = await supabase
    .from("portal_tokens")
    .select("token, expires_at")
    .eq("company_id", ctx.company.id)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  const now = new Date();
  const valid = (tokens ?? []).find(
    (t) => !t.expires_at || new Date(t.expires_at) > now,
  );
  if (valid) return { link: `${baseUrl}/p/${valid.token}` };

  const { data, error } = await supabase
    .from("portal_tokens")
    .insert({ company_id: ctx.company.id, customer_id: customerId })
    .select("token")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not create portal link." };

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "portal.link_created",
    entity_type: "customer",
    entity_id: customerId,
  });

  return { link: `${baseUrl}/p/${data.token}` };
}

/** Company member: revoke all portal links for a customer. */
export async function revokePortalLinks(customerId: string) {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const supabase = await createClient();
  await supabase
    .from("portal_tokens")
    .delete()
    .eq("company_id", ctx.company.id)
    .eq("customer_id", customerId);
  revalidatePath(`/dashboard/customers/${customerId}`);
  return { ok: true };
}

/** Portal visitor: approve or decline their own quote. */
export async function portalSetQuoteStatus(
  token: string,
  quoteId: string,
  status: "approved" | "declined",
): Promise<{ error?: string; ok?: boolean }> {
  const ctx = await getPortalContext(token);
  if (!ctx) return { error: "This portal link is invalid or expired." };

  const svc = await createServiceClient();
  const { data: quote } = await svc
    .from("quotes")
    .select("id, status")
    .eq("id", quoteId)
    .eq("company_id", ctx.company.id)
    .eq("customer_id", ctx.customer.id)
    .single();
  if (!quote) return { error: "Quote not found." };
  if (quote.status !== "sent") {
    return { error: "This quote can no longer be changed." };
  }

  const { error } = await svc
    .from("quotes")
    .update({ status })
    .eq("id", quoteId);
  if (error) return { error: error.message };

  await svc.from("audit_logs").insert({
    company_id: ctx.company.id,
    actor_user_id: null,
    action: `quote.${status}_by_customer`,
    entity_type: "quote",
    entity_id: quoteId,
    metadata: { via: "portal" },
  });

  revalidatePath(`/p/${token}`);
  revalidatePath(`/p/${token}/quotes/${quoteId}`);
  return { ok: true };
}

/** Portal visitor: start a Stripe Checkout session for an invoice balance. */
export async function portalCheckout(
  token: string,
  invoiceId: string,
  baseUrl: string,
): Promise<{ error?: string; url?: string }> {
  const stripe = getStripe();
  if (!stripe) return { error: "Online payments aren't set up yet." };

  const ctx = await getPortalContext(token);
  if (!ctx) return { error: "This portal link is invalid or expired." };
  if (!ctx.company.stripe_account_id || !ctx.company.stripe_onboarded) {
    return { error: "This business hasn't enabled online payments yet." };
  }

  const svc = await createServiceClient();
  const { data: invoice } = await svc
    .from("invoices")
    .select("id, invoice_number, status, total_cents, amount_paid_cents")
    .eq("id", invoiceId)
    .eq("company_id", ctx.company.id)
    .eq("customer_id", ctx.customer.id)
    .single();
  if (!invoice) return { error: "Invoice not found." };
  if (!["sent", "overdue"].includes(invoice.status)) {
    return { error: "This invoice can't be paid online." };
  }
  const due = invoice.total_cents - invoice.amount_paid_cents;
  if (due <= 0) return { error: "This invoice is already paid." };

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Invoice ${invoice.invoice_number} — ${ctx.company.name}`,
            },
            unit_amount: due,
          },
          quantity: 1,
        },
      ],
      customer_email: ctx.customer.email ?? undefined,
      success_url: `${baseUrl}/p/${token}/invoices/${invoiceId}?paid=1`,
      cancel_url: `${baseUrl}/p/${token}/invoices/${invoiceId}`,
      metadata: { invoice_id: invoiceId, company_id: ctx.company.id },
    },
    { stripeAccount: ctx.company.stripe_account_id },
  );

  return { url: session.url ?? undefined };
}
