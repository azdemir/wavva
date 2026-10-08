"use server";

import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getStripe } from "@/lib/stripe";

/**
 * Start (or resume) Stripe Connect onboarding for the company.
 * Creates an Express account on first use, then returns the onboarding link.
 * Requires STRIPE_SECRET_KEY — otherwise returns a clear setup message.
 */
export async function startConnectOnboarding(
  baseUrl: string,
): Promise<{ error?: string; url?: string }> {
  const ctx = await requireOwner();
  const stripe = getStripe();
  if (!stripe) {
    return {
      error:
        "Stripe isn't configured yet. Add STRIPE_SECRET_KEY to the environment, then try again.",
    };
  }

  const supabase = await createClient();
  let accountId: string | null =
    (ctx.company as { stripe_account_id?: string | null }).stripe_account_id ?? null;

  try {
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: ctx.company.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { company_id: ctx.company.id, company_name: ctx.company.name },
      });
      accountId = account.id;
      await supabase
        .from("companies")
        .update({ stripe_account_id: accountId })
        .eq("id", ctx.company.id);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/dashboard/billing`,
      return_url: `${baseUrl}/dashboard/billing?onboarded=1`,
      type: "account_onboarding",
    });

    await logAudit(supabase, {
      company_id: ctx.company.id,
      action: "billing.connect_started",
      entity_type: "company",
      entity_id: ctx.company.id,
    });

    return { url: link.url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Stripe onboarding failed." };
  }
}
