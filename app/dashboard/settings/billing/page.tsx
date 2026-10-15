import { getTranslations } from "next-intl/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "@/components/ui/icons";
import {
  getBillingState,
} from "@/lib/actions/platform-billing";
import { PlanButton, ManageSubscriptionButton } from "@/components/billing/billing-buttons";
import { PLANS, PLAN_IDS, formatPrice, subscriptionInGoodStanding } from "@/lib/plans";

const STATUS_TONES: Record<string, "accent" | "amber" | "slate" | "red"> = {
  trialing: "accent",
  active: "accent",
  past_due: "amber",
  unpaid: "red",
  canceled: "slate",
  none: "slate",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const t = await getTranslations("billing");
  const state = await getBillingState();
  const plan = PLANS[state.plan];
  const statusKey = state.subscriptionStatus in STATUS_TONES ? state.subscriptionStatus : "none";
  const statusTone = STATUS_TONES[statusKey];
  const good = subscriptionInGoodStanding(state.subscriptionStatus);
  const trialDaysLeft = state.trialDaysLeft;
  const seats = PLANS[state.plan].seats;
  const seatsLabel = seats === null ? t("seats.unlimited") : t("seats.count", { count: seats });

  return (
    <div className="max-w-4xl space-y-8">
      <Heading
        title={t("title")}
        description={t("description")}
      />

      {checkout === "success" && (
        <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900">
          {t("checkout.success")}
        </div>
      )}
      {checkout === "cancelled" && (
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
          {t("checkout.cancelled")}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{t("currentPlan")}</p>
              <div className="mt-1 flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{plan.name}</h2>
                <Badge tone={statusTone}>{t(`status.${statusKey}`)}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">
                {t("usageLine", { price: formatPrice(plan.priceCents), used: state.memberCount, seats: seatsLabel })}
                {trialDaysLeft !== null && state.subscriptionStatus === "trialing" && (
                  <> · {t("trialDaysLeft", { count: trialDaysLeft })}</>
                )}
              </p>
            </div>
            {state.hasSubscription ? (
              <ManageSubscriptionButton />
            ) : (
              <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                {t("noSubscription")}
              </p>
            )}
          </div>
          {!good && state.hasSubscription && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              {t("billingIssue")}
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("plansTitle")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLAN_IDS.map((id) => {
            const p = PLANS[id];
            const isCurrent = id === state.plan && state.hasSubscription;
            const features = t.raw(`plans.${id}.features`) as string[];
            return (
              <Card key={id} className={isCurrent ? "ring-2 ring-brand-600" : undefined}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{p.name}</h3>
                    {isCurrent && <Badge tone="accent">{t("current")}</Badge>}
                  </div>
                  <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {formatPrice(p.priceCents)}
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400 dark:text-slate-500">{t("perMonth")}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{t(`plans.${id}.blurb`)}</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">
                    {features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <PlanButton
                      planId={id}
                      label={state.hasSubscription ? t("switchTo", { plan: p.name }) : t("startTrial")}
                      outline={good}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
          {t("footnote")}
        </p>
      </div>
    </div>
  );
}
