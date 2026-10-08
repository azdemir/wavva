import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Cta } from "@/components/marketing/cta";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about getting started with TidyPro, the product, billing, and how your business data stays private.",
};

type FaqGroup = { title: string; items: { q: string; a: string }[] };

const groups: FaqGroup[] = [
  {
    title: "Getting started",
    items: [
      {
        q: "Is TidyPro only for cleaning businesses in Upstate New York?",
        a: "We designed TidyPro with Upstate cleaners in mind — service areas by city, county, ZIP code, or radius, Eastern Time scheduling, and USD pricing. But any residential or commercial cleaning business in the US can use it.",
      },
      {
        q: "I'm not technical. Is it hard to set up?",
        a: "No. A guided setup walks you through your business profile, services, pricing, and service area, then helps you invite your team. Most owners finish in under 30 minutes, and there's no software to install.",
      },
      {
        q: "What happens after my 14-day trial?",
        a: "Choose a plan to keep going — we'll remind you before the trial ends. If you don't pick a plan, your workspace is paused, not deleted, and you can reactivate it anytime.",
      },
      {
        q: "Do you offer onboarding help?",
        a: "Every plan includes a guided setup wizard and email support. The Pro plan adds dedicated onboarding where we help configure your services, pricing, and team.",
      },
    ],
  },
  {
    title: "Product",
    items: [
      {
        q: "Can my cleaners use it on their phones?",
        a: "Yes. Job views are designed mobile-first: cleaners see their day's jobs, tap into job details, work through checklists, upload before-and-after photos, and mark jobs complete — all from a phone browser.",
      },
      {
        q: "I run multiple crews. Can TidyPro handle that?",
        a: "Yes. The Growth plan includes crew scheduling with conflict alerts, and Pro adds multi-crew scheduling views plus business reports for larger operations.",
      },
      {
        q: "Can customers reschedule without calling me?",
        a: "Yes — through the customer portal, using the cancellation and rescheduling rules you configure for your business. You stay in control of the policy; customers get the convenience.",
      },
      {
        q: "Where do job photos go?",
        a: "Before-and-after photos upload from the job site into secure storage attached to the job record (Pro plan). They're visible to your team and can be shared with the customer through their portal.",
      },
    ],
  },
  {
    title: "Billing & privacy",
    items: [
      {
        q: "How do my customers pay me?",
        a: "You create and send invoices from TidyPro, and customers pay by card through their customer portal. Payments go directly to your business account — completely separate from your TidyPro subscription.",
      },
      {
        q: "Does TidyPro handle sales tax for me?",
        a: "You can configure tax rates on your invoices, but tax rules vary by location and situation. Have your accountant verify what's required for your business — we don't assume tax requirements on your behalf.",
      },
      {
        q: "Can I cancel anytime?",
        a: "Yes. Plans are month-to-month with no contracts, and you keep access until the end of your billing period.",
      },
      {
        q: "Is my business data private from other cleaning companies?",
        a: "Yes. Every company gets its own private workspace — your customers, staff, schedules, and financial records are isolated and never visible to any other company on the platform.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          eyebrow="FAQ"
          title="Questions cleaning owners ask us"
          description="Straight answers — including the ones about tax, payments, and privacy."
        />

        <section className="bg-white py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-3xl space-y-12">
              {groups.map((g) => (
                <div key={g.title}>
                  <h2 className="text-xl font-bold text-slate-900">
                    {g.title}
                  </h2>
                  <div className="mt-5 space-y-4">
                    {g.items.map((f) => (
                      <details
                        key={f.q}
                        className="group rounded-xl border border-slate-200 bg-white px-6 py-4 open:shadow-sm"
                      >
                        <summary className="cursor-pointer list-none text-base font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                          <span className="flex items-center justify-between gap-4">
                            {f.q}
                            <span
                              aria-hidden="true"
                              className="text-xl font-normal text-brand-600 transition-transform group-open:rotate-45"
                            >
                              +
                            </span>
                          </span>
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">
                          {f.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
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
