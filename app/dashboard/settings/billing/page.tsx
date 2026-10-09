import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "@/components/ui/icons";
import {
  getBillingState,
} from "@/lib/actions/platform-billing";
import { PlanButton, ManageSubscriptionButton } from "@/components/billing/billing-buttons";
import { PLANS, PLAN_IDS, formatPrice, seatLimitLabel, subscriptionInGoodStanding } from "@/lib/plans";

const STATUS_LABEL: Record<string, { label: string; tone: "accent" | "amber" | "slate" | "red" }> = {
  trialing: { label: "Trial", tone: "accent" },
  active: { label: "Active", tone: "accent" },
  past_due: { label: "Past due", tone: "amber" },
  unpaid: { label: "Unpaid", tone: "red" },
  canceled: { label: "Canceled", tone: "slate" },
  none: { label: "No subscription", tone: "slate" },
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const state = await getBillingState();
  const plan = PLANS[state.plan];
  const status = STATUS_LABEL[state.subscriptionStatus] ?? STATUS_LABEL.none;
  const good = subscriptionInGoodStanding(state.subscriptionStatus);
  const trialDaysLeft = state.trialDaysLeft;

  return (
    <div className="max-w-4xl space-y-8">
      <Heading
        title="Billing"
        description="Your TidyPro subscription — separate from the payments your customers make to you."
      />

      {checkout === "success" && (
        <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900">
          Subscription started — your 14-day free trial is on. Welcome aboard.
        </div>
      )}
      {checkout === "cancelled" && (
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
          Checkout was cancelled. No charge was made — pick a plan whenever you&apos;re ready.
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Current plan</p>
              <div className="mt-1 flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{plan.name}</h2>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">
                {formatPrice(plan.priceCents)}/month · {state.memberCount} of {seatLimitLabel(state.plan)} used
                {trialDaysLeft !== null && state.subscriptionStatus === "trialing" && (
                  <> · {trialDaysLeft} trial day{trialDaysLeft === 1 ? "" : "s"} left</>
                )}
              </p>
            </div>
            {state.hasSubscription ? (
              <ManageSubscriptionButton />
            ) : (
              <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                Start a plan below — every plan begins with a 14-day free trial, no card required up front
                beyond Stripe&apos;s normal checkout.
              </p>
            )}
          </div>
          {!good && state.hasSubscription && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              There&apos;s a billing issue on your account. Use “Manage subscription” to update your payment
              method.
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Plans</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLAN_IDS.map((id) => {
            const p = PLANS[id];
            const isCurrent = id === state.plan && state.hasSubscription;
            return (
              <Card key={id} className={isCurrent ? "ring-2 ring-brand-600" : undefined}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{p.name}</h3>
                    {isCurrent && <Badge tone="accent">Current</Badge>}
                  </div>
                  <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {formatPrice(p.priceCents)}
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400 dark:text-slate-500">/mo</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{p.blurb}</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <PlanButton
                      planId={id}
                      label={state.hasSubscription ? `Switch to ${p.name}` : "Start 14-day trial"}
                      outline={good}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
          Plans are billed by TidyPro through Stripe. This is separate from Stripe Connect, which you use
          to collect payments from your own customers.
        </p>
      </div>
    </div>
  );
}
