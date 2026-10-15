import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/permissions";
import { Heading } from "@/components/ui/heading";
import { ImportWizard } from "@/components/import/import-wizard";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; import_error?: string }>;
}) {
  // Owner + manager only — cleaners are redirected by requirePermission.
  const { company } = await requirePermission("customers.manage");
  const t = await getTranslations("import");
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <Heading title={t("title")} description={t("description")} />
      <ImportWizard
        timezone={company.timezone || "America/New_York"}
        connected={params.connected}
        importError={params.import_error}
      />
    </div>
  );
}
