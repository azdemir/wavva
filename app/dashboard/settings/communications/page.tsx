import { getTranslations } from "next-intl/server";
import { requireOwner } from "@/lib/auth";
import { hasFeature, isPlanId } from "@/lib/plans";
import { Heading } from "@/components/ui/heading";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { getCommunicationTemplates } from "@/lib/actions/communications";
import { TemplateManager } from "@/components/communications/template-manager";

export default async function CommunicationsSettingsPage() {
  const { company } = await requireOwner();
  const plan = isPlanId(company.plan) ? company.plan : "essential";
  const t = await getTranslations("communications");

  if (!hasFeature(plan, "communications")) {
    return (
      <div className="max-w-5xl space-y-6">
        <Heading title={t("title")} description={t("description")} />
        <UpgradePrompt feature="communications" />
      </div>
    );
  }

  const templates = await getCommunicationTemplates();

  return (
    <div className="max-w-5xl space-y-6">
      <Heading title={t("title")} description={t("description")} />
      <TemplateManager templates={templates} />
    </div>
  );
}
