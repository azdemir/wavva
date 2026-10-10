import { getTranslations } from "next-intl/server";
import { requireOwner } from "@/lib/auth";
import { hasFeature, isPlanId } from "@/lib/plans";
import { Heading } from "@/components/ui/heading";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { listChecklistTemplates } from "@/lib/actions/checklists";
import { ChecklistStudio } from "@/components/checklists/checklist-studio";

export default async function ChecklistsPage() {
  const { company } = await requireOwner();
  const plan = isPlanId(company.plan) ? company.plan : "starter";
  const t = await getTranslations("checklists");

  if (!hasFeature(plan, "checklists")) {
    return (
      <div className="max-w-3xl space-y-6">
        <Heading title={t("ai.title")} description={t("ai.description")} />
        <UpgradePrompt feature="checklists" />
      </div>
    );
  }

  const templates = await listChecklistTemplates();

  return (
    <div className="max-w-3xl space-y-6">
      <Heading title={t("ai.title")} description={t("ai.description")} />
      <ChecklistStudio initial={templates} />
    </div>
  );
}
