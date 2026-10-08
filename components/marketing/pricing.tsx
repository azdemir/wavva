import { plans } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "@/components/ui/icons";

/** The three plan cards without any surrounding heading — reusable on the
 * dedicated pricing page where the page hero already introduces them. */
export function PlanCards() {
  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-3">
      {plans.map((plan) => (
        <Card
          key={plan.name}
          className={
            plan.featured ? "relative border-2 border-brand-600 shadow-lg" : ""
          }
        >
          {plan.featured && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <Badge tone="brand" className="px-3 py-1 text-xs">
                Most popular
              </Badge>
            </div>
          )}
          <CardContent className="flex h-full flex-col">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {plan.name}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{plan.blurb}</p>
            <p className="mt-4">
              <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                ${plan.price}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400"> /month</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400"
                >
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              href="/demo"
              variant={plan.featured ? "primary" : "outline"}
              className="mt-8 w-full"
            >
              {plan.cta}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PricingDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-sm text-slate-500 ${className}`}>
      Suggested pricing shown for illustration — final plans confirmed at
      launch. Prices in USD. Cancel anytime.
    </p>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-white py-20 sm:py-24 dark:bg-slate-950">
      <Container>
        <SectionHeading
          eyebrow="Pricing"
          title="Simple plans that pay for themselves"
          description="One booking a month covers the subscription for most companies. Start free, upgrade when you grow."
        />
        <div className="mt-12">
          <PlanCards />
        </div>
        <PricingDisclaimer className="mt-8" />
      </Container>
    </section>
  );
}
