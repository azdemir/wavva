"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getStripe } from "@/lib/stripe";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth";
import { isPlanId, type PlanId } from "@/lib/plans";
import { logAudit } from "@/lib/audit";

const PRICE_ENV: Record<PlanId, string> = {
  basic: "STRIPE_PRICE_BASIC",
  starter: "STRIPE_PRICE_STARTER",
  growth: "STRIPE_PRICE_GROWTH",
  pro: "STRIPE_PRICE_PRO",
};

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Ensure the company has a Stripe customer for platform billing; create one if needed. */
async function getOrCreateCustomer(companyId: string, companyName: string, email: string | null) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured.");
  const svc = await createServiceClient();
  const { data: company } = await svc
    .from("companies")
    .select("stripe_customer_id")
    .eq("id", companyId)
    .single();

  if (company?.stripe_customer_id) return company.stripe_customer_id as string;

  const customer = await stripe.customers.create({
    name: companyName,
    email: email ?? undefined,
    metadata: { company_id: companyId, kind: "platform_billing" },
  });
  await svc.from("companies").update({ stripe_customer_id: customer.id }).eq("id", companyId);
  return customer.id;
}

/**
 * Owner picks a plan → Stripe Checkout (subscription mode, 14-day trial).
 * Redirects the browser straight to Stripe.
 */
export async function createPlanCheckout(planId: string) {
  const ctx = await requireOwner();
  const t = await getTranslations("billing");
  if (!isPlanId(planId)) return { error: t("errors.unknownPlan") };

  const stripe = getStripe();
  if (!stripe) return { error: t("errors.stripeNotConfigured") };
  const priceId = process.env[PRICE_ENV[planId]];
  if (!priceId) {
    return { error: t("errors.missingPrice", { env: PRICE_ENV[planId] }) };
  }

  const customerId = await getOrCreateCustomer(ctx.company.id, ctx.company.name, ctx.user.email ?? null);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { company_id: ctx.company.id, plan: planId, kind: "platform_billing" },
    },
    metadata: { company_id: ctx.company.id, plan: planId, kind: "platform_billing" },
    success_url: `${siteUrl()}/dashboard/settings/billing?checkout=success`,
    cancel_url: `${siteUrl()}/dashboard/settings/billing?checkout=cancelled`,
  });

  if (!session.url) return { error: t("errors.checkoutFailed") };
  redirect(session.url);
}

/** Owner manages their platform subscription (payment method, cancel) in Stripe's portal. */
export async function createBillingPortalSession() {
  const ctx = await requireOwner();
  const stripe = getStripe();
  const t = await getTranslations("billing");
  if (!stripe) return { error: t("errors.stripeNotConfigured") };

  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("stripe_customer_id")
    .eq("id", ctx.company.id)
    .single();
  if (!company?.stripe_customer_id) {
    return { error: t("errors.noSubscription") };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: company.stripe_customer_id as string,
    return_url: `${siteUrl()}/dashboard/settings/billing`,
  });
  redirect(session.url);
}

/** Shape the billing page needs. */
export async function getBillingState() {
  const ctx = await requireOwner();
  const supabase = await createClient();
  const [{ data: company }, { count: memberCount }] = await Promise.all([
    supabase
      .from("companies")
      .select("plan, subscription_status, stripe_subscription_id")
      .eq("id", ctx.company.id)
      .single(),
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("company_id", ctx.company.id),
  ]);

  let trialEndsAt: string | null = null;
  let trialDaysLeft: number | null = null;
  if (company?.stripe_subscription_id) {
    try {
      const stripe = getStripe();
      const sub = await stripe?.subscriptions.retrieve(company.stripe_subscription_id as string);
      const se = sub as { trial_end?: number | null } | undefined;
      if (se?.trial_end) {
        trialEndsAt = new Date(se.trial_end * 1000).toISOString();
        trialDaysLeft = Math.max(0, Math.ceil((se.trial_end * 1000 - Date.now()) / 86400000));
      }
    } catch {
      trialEndsAt = null;
    }
  }

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "billing.viewed",
    entity_type: "company",
    entity_id: ctx.company.id,
  }).catch(() => {});

  return {
    plan: (company?.plan ?? "starter") as PlanId,
    subscriptionStatus: (company?.subscription_status ?? "none") as string,
    hasSubscription: !!company?.stripe_subscription_id,
    memberCount: memberCount ?? 0,
    trialEndsAt,
    trialDaysLeft,
  };
}
