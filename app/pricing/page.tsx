import type { Metadata } from "next";
import { plans } from "@/lib/site";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Cta } from "@/components/marketing/cta";
import { PageHero } from "@/components/marketing/page-hero";
import {
  PlanCards,
  PricingDisclaimer,
} from "@/components/marketing/pricing";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon } from "@/components/ui/icons";
import { getContent } from "@/lib/studio/content";


export const metadata: Metadata = {
  title: "Flat Pricing from $49/mo — No Per-User Fees",
  description:
    "TidyPro pricing: flat monthly plans from $49 — Starter, Growth $99, Pro $199. No per-user fees, ever. 14-day free trial, no credit card required. Cancel anytime.",
  alternates: { canonical: "/pricing" },
};

const comparisonRows: { label: string; values: (string | boolean)[] }[] = [
  { label: "Users", values: ["1", "Up to 5", "Unlimited"] },
  { label: "Active customers", values: ["Up to 50", "Unlimited", "Unlimited"] },
  { label: "Quotes & bookings", values: [true, true, true] },
  { label: "Recurring bookings", values: [false, true, true] },
  { label: "Customer portal", values: [false, true, true] },
  { label: "Crew scheduling & conflict alerts", values: [false, true, true] },
  { label: "Before/after photo uploads", values: [false, false, true] },
  { label: "Business reports", values: [false, false, true] },
  { label: "Support", values: ["Email", "Priority", "Dedicated onboarding"] },
];

export default async function PricingPage() {
  const [heroEyebrow, heroTitle, heroDescription, faqs] = await Promise.all([
    getContent<string>("pricing.hero.eyebrow"),
    getContent<string>("pricing.hero.title"),
    getContent<string>("pricing.hero.description"),
    getContent<{ q: string; a: string }[]>("pricing.billing_faqs"),
  ]);
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          eyebrow={heroEyebrow}
          title={heroTitle}
          description={heroDescription}
          crumbs={[{ label: "Pricing", href: "/pricing" }]}
        />

        <section className="bg-white pt-4 pb-16 sm:pb-20 dark:bg-slate-950">
          <Container>
            <PlanCards />
            <PricingDisclaimer className="mt-8" />
          </Container>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900 py-16 sm:py-20">
          <Container>
            <SectionHeading
              eyebrow="Compare plans"
              title="What's included in each plan"
              description="Every plan includes quotes, bookings, basic invoicing, and email support."
            />
            <Card className="mx-auto mt-10 max-w-4xl overflow-hidden">
              <p className="border-b border-slate-200 px-4 py-2 text-center text-xs font-medium text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:hidden">
                Swipe sideways to compare all plans →
              </p>
              <div className="relative overflow-x-auto">
                <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent dark:from-slate-900 sm:hidden" />
                <table className="w-full min-w-[560px] text-left text-sm">
                  <caption className="sr-only">
                    Feature comparison across Starter, Growth, and Pro plans
                  </caption>
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <th scope="col" className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                        Feature
                      </th>
                      {plans.map((p) => (
                        <th
                          key={p.name}
                          scope="col"
                          className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-slate-100"
                        >
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {comparisonRows.map((row) => (
                      <tr key={row.label}>
                        <th
                          scope="row"
                          className="px-6 py-3.5 font-medium text-slate-700 dark:text-slate-300"
                        >
                          {row.label}
                        </th>
                        {row.values.map((v, i) => (
                          <td
                            key={i}
                            className="px-6 py-3.5 text-center text-slate-600 dark:text-slate-400"
                          >
                            {v === true ? (
                              <CheckIcon className="mx-auto h-5 w-5 text-accent-600" />
                            ) : v === false ? (
                              <span aria-label="Not included" className="text-slate-300">
                                —
                              </span>
                            ) : (
                              v
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Container>
        </section>

        <section className="bg-white py-16 sm:py-20 dark:bg-slate-950">
          <Container>
            <SectionHeading
              eyebrow="Billing questions"
              title="How billing works"
            />
            <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
              {faqs.map((f) => (
                <Card key={f.q}>
                  <CardContent>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {f.q}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {f.a}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <Cta />
      </main>
      <Footer />
    </>
  );
}
