import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LockIcon } from "@/components/ui/icons";
import { requiredPlanFor, type PlanFeature } from "@/lib/plans";

/** Shown when the company's plan doesn't include a feature. */
export async function UpgradePrompt({ feature }: { feature: PlanFeature }) {
  const t = await getTranslations("common");
  const planName = requiredPlanFor(feature);
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <LockIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
          {t("upgrade.title", { plan: planName })}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
          {t("upgrade.description", { plan: planName })}
        </p>
        <Button href="/dashboard/billing" className="mt-6">
          {t("upgrade.cta")}
        </Button>
      </CardContent>
    </Card>
  );
}
