import { getTranslations } from "next-intl/server";
import { requireOwner } from "@/lib/auth";
import { Heading } from "@/components/ui/heading";
import { getCommunicationTemplates } from "@/lib/actions/communications";
import { TemplateManager } from "@/components/communications/template-manager";

export default async function CommunicationsSettingsPage() {
  await requireOwner();
  const t = await getTranslations("communications");
  const templates = await getCommunicationTemplates();

  return (
    <div className="max-w-5xl space-y-6">
      <Heading title={t("title")} description={t("description")} />
      <TemplateManager templates={templates} />
    </div>
  );
}
