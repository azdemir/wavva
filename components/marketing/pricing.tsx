import { plans } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/marketing/reveal";
import { Ambient } from "@/components/marketing/ambient";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/icons";
import { getContent } from "@/lib/studio/content";

/** The four plan cards without any surrounding heading — reusable on the
 *  dedicated pricing page where the page hero already introduces them. */
export function PlanCards() {
  return (
    <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {plans.map((plan, i) => (
        <Reveal key={plan.name} delay={i * 80} className="h-full min-w-0">
          <div
            className={`group/plan relative flex h-full flex-col overflow-hidden rounded-2xl p-7 transition-all duration-300 ${
              plan.featured
                ? "bg-night text-white shadow-[0_28px_70px_-30px_rgba(7,8,12,0.9)] ring-1 ring-white/10"
                : "bg-surface shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-30px_rgba(15,23,42,0.4)]"
            }`}
          >
            {plan.featured && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl"
              />
            )}

            {/* Fixed-height badge slot so the featured card's name and price
                line up with the other three instead of being pushed down. */}
            <div className="relative mb-4 h-6">
              {plan.featured && (
                <Badge
                  tone="brand"
                  className="bg-brand-500/15 px-2.5 py-1 text-[11px] ring-brand-400/30 dark:text-brand-200"
                >
                  Most popular
                </Badge>
              )}
            </div>

            <h3
              className={`text-lg font-semibold ${
                plan.featured ? "text-white" : "text-ink"
              }`}
            >
              {plan.name}
            </h3>
            <p
              className={`mt-1.5 min-h-10 text-sm leading-relaxed ${
                plan.featured ? "text-white/55" : "text-ink-3"
              }`}
            >
              {plan.blurb}
            </p>

            <p className="mt-6 flex items-baseline gap-1.5">
              <span
                className={`font-display text-5xl leading-none tracking-[-0.02em] ${
                  plan.featured ? "text-white" : "text-ink"
                }`}
              >
                ${plan.price}
              </span>
              <span
                className={`text-sm ${
                  plan.featured ? "text-white/50" : "text-ink-3"
                }`}
              >
                /month
              </span>
            </p>

            <ul className="mt-7 flex-1 space-y-3">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className={`flex items-start gap-2.5 text-sm leading-snug ${
                    plan.featured ? "text-white/75" : "text-ink-2"
                  }`}
                >
                  <CheckIcon
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      plan.featured ? "text-accent-400" : "text-accent-600"
                    }`}
                  />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              href="/demo"
              variant={plan.featured ? "primary" : "outline"}
              className={`mt-8 w-full rounded-full ${
                plan.featured ? "" : "bg-surface text-ink hover:bg-surface-2"
              }`}
            >
              {plan.cta}
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover/plan:translate-x-0.5" />
            </Button>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function PricingDisclaimer({ className = "" }: { className?: string }) {
  return <PricingDisclaimerText className={className} />;
}

async function PricingDisclaimerText({ className = "" }: { className?: string }) {
  const text = await getContent<string>("home.pricing.disclaimer");
  return <p className={`text-center text-sm text-ink-3 ${className}`}>{text}</p>;
}

export async function Pricing() {
  const [eyebrow, title, description] = await Promise.all([
    getContent<string>("home.pricing.eyebrow"),
    getContent<string>("home.pricing.title"),
    getContent<string>("home.pricing.description"),
  ]);
  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 overflow-hidden bg-surface-2 py-24 sm:py-28 lg:py-32"
    >
      <Ambient tone="dark" className="opacity-60" />
      <Container className="relative">
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
        </Reveal>
        <div className="mt-14">
          <PlanCards />
        </div>
        <PricingDisclaimer className="mt-10" />
      </Container>
    </section>
  );
}