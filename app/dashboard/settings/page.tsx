import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireOwner } from "@/lib/auth";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";
import { QuickBooksCard } from "@/components/settings/quickbooks-card";

export default async function SettingsPage() {
  const { company } = await requireOwner();
  const t = await getTranslations("settings");

  return (
    <div className="max-w-3xl space-y-8">
      <Heading
        title={t("title")}
        description={t("description")}
      />
      <Link href="/dashboard/settings/billing" className="block">
        <Card className="transition hover:border-brand-300 hover:shadow-sm">
          <CardContent className="flex items-center justify-between py-5">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{t("billingCard.title")}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                {t("billingCard.description")}
              </p>
            </div>
            <span className="text-sm font-semibold text-brand-700 dark:text-brand-400">{t("billingCard.manage")}</span>
          </CardContent>
        </Card>
      </Link>
      <Link href="/dashboard/settings/communications" className="block">
        <Card className="transition hover:border-brand-300 hover:shadow-sm">
          <CardContent className="flex items-center justify-between py-5">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{t("communicationsCard.title")}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                {t("communicationsCard.description")}
              </p>
            </div>
            <span className="text-sm font-semibold text-brand-700 dark:text-brand-400">{t("communicationsCard.manage")}</span>
          </CardContent>
        </Card>
      </Link>
      <Card>
        <CardContent className="pt-6">
          <SettingsForm company={company} />
        </CardContent>
      </Card>
      <QuickBooksCard />
    </div>
  );
}
