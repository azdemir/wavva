import { headers } from "next/headers";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isStripeConfigured } from "@/lib/stripe";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@/components/billing/connect-button";

export const instant = false;

/** Owner-only: connect the company's Stripe account to receive payments. */
export default async function BillingPage() {
  const { company } = await requireOwner();
  const supabase = await createClient();

  // Refresh onboarding state from the companies row (webhook updates it).
  const { data: fresh } = await supabase
    .from("companies")
    .select("stripe_account_id, stripe_onboarded")
    .eq("id", company.id)
    .single();

  const connected = !!fresh?.stripe_account_id;
  const onboarded = !!fresh?.stripe_onboarded;

  const h = await headers();
  const baseUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  return (
    <div className="max-w-2xl space-y-8">
      <Heading
        title="Billing"
        description="Get paid by card through Stripe. Money goes straight to your business bank account."
      />

      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
          <CardDescription>
            Connect takes a few minutes: Stripe verifies your business, then
            customers can pay invoices by card from their portal link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600 dark:text-slate-400 dark:text-slate-500">Status:</span>
            {!connected && <Badge tone="slate">Not connected</Badge>}
            {connected && !onboarded && <Badge tone="amber">Onboarding incomplete</Badge>}
            {connected && onboarded && <Badge tone="accent">Ready to accept payments</Badge>}
          </div>

          {!isStripeConfigured() && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              The platform hasn&apos;t configured Stripe yet (no STRIPE_SECRET_KEY).
              Offline payments (cash, check) work regardless — see any invoice.
            </div>
          )}

          {(!connected || !onboarded) && isStripeConfigured() && (
            <ConnectButton baseUrl={baseUrl} />
          )}

          {connected && onboarded && (
            <p className="text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">
              Customers with portal links can now pay invoices online. Payouts
              land in the bank account on your Stripe Express dashboard.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
