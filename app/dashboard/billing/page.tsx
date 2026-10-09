import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("billing");
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
        title={t("title")}
        description={t("connect.description")}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("connect.cardTitle")}</CardTitle>
          <CardDescription>
            {t("connect.cardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600 dark:text-slate-400 dark:text-slate-500">{t("connect.status")}</span>
            {!connected && <Badge tone="slate">{t("connect.notConnected")}</Badge>}
            {connected && !onboarded && <Badge tone="amber">{t("connect.incomplete")}</Badge>}
            {connected && onboarded && <Badge tone="accent">{t("connect.ready")}</Badge>}
          </div>

          {!isStripeConfigured() && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              {t("connect.notConfigured")}
            </div>
          )}

          {(!connected || !onboarded) && isStripeConfigured() && (
            <ConnectButton baseUrl={baseUrl} />
          )}

          {connected && onboarded && (
            <p className="text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">
              {t("connect.readyNote")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
