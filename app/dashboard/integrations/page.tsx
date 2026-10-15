import { requirePermission } from "@/lib/permissions";
import { getTranslations } from "next-intl/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { hasFeature, isPlanId } from "@/lib/plans";
import { getIntegrationState } from "@/lib/actions/integrations";
import { EVENT_CATALOG } from "@/lib/integrations/webhooks";
import { MailchimpCard } from "@/components/integrations/mailchimp-card";
import { WebhooksCard } from "@/components/integrations/webhooks-card";

export const instant = false;

export default async function IntegrationsPage() {
  const { company } = await requirePermission("settings.manage");
  const t = await getTranslations("integrations");
  const plan = isPlanId(company.plan) ? company.plan : "essential";

  return (
    <div className="space-y-6">
      <Heading
        title={t("heading.title")}
        description={t("heading.description")}
      />

      {!hasFeature(plan, "integrations") ? (
        <UpgradePrompt feature="integrations" />
      ) : (
        <IntegrationsContent />
      )}
    </div>
  );
}

async function IntegrationsContent() {
  const t = await getTranslations("integrations");
  const state = await getIntegrationState();

  if (state.setupRequired) {
    return (
      <Card>
        <CardContent className="py-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("setup.title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            {t("setup.description")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
      <MailchimpCard initial={state.mailchimp} />
      <WebhooksCard initial={state.webhooks} events={EVENT_CATALOG} />
    </div>
  );
}
