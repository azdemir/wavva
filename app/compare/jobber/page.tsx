import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Cta } from "@/components/marketing/cta";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { CheckIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "TidyPro vs Jobber — Cleaning Software Comparison",
  description:
    "TidyPro vs Jobber for cleaning businesses: flat pricing with no per-user fees vs per-user plans, built-in quote follow-up, and cleaning-first design. Compare before you choose.",
  alternates: { canonical: "/compare/jobber" },
};

const ROWS: { label: string; tidy: string; tidyGood: boolean; other: string; otherGood: boolean }[] = [
  {
    label: "Pricing model",
    tidy: "Flat monthly price — your whole team included",
    tidyGood: true,
    other: "Per-user pricing — the bill grows every time you hire",
    otherGood: false,
  },
  {
    label: "Quote follow-up",
    tidy: "Automated follow-up emails built in on every plan",
    tidyGood: true,
    other: "Follow-ups available, typically on higher tiers or add-ons",
    otherGood: false,
  },
  {
    label: "Cleaning-specific design",
    tidy: "Built for cleaning: recurring routes, checklists, before/after photos",
    tidyGood: true,
    other: "General field-service tool adapted for many trades",
    otherGood: false,
  },
  {
    label: "Free trial",
    tidy: "14 days, no credit card required",
    tidyGood: true,
    other: "Trial available",
    otherGood: true,
  },
  {
    label: "Customer portal",
    tidy: "Included — clients approve quotes and pay online",
    tidyGood: true,
    other: "Included",
    otherGood: true,
  },
];

const FAQS = [
  {
    q: "Is TidyPro cheaper than Jobber?",
    a: "For most cleaning teams, yes — and the gap widens as you grow. TidyPro charges one flat monthly price (from $19) no matter how many cleaners you add. Per-user platforms raise your bill with every hire, which is the most common complaint we hear from owners who switch.",
  },
  {
    q: "Does TidyPro do automated quote follow-up?",
    a: "Yes — it's built into every plan. When you send a quote, TidyPro automatically follows up with the customer on your schedule until the quote is approved, declined, or expires. It's one of the main reasons cleaning businesses switch to us.",
  },
  {
    q: "Can I migrate from Jobber to TidyPro?",
    a: "Yes. Export your customers from Jobber as a spreadsheet and import them into TidyPro during onboarding. Most businesses are fully moved over in an afternoon.",
  },
];

export default function CompareJobberPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />
      <main>
        <PageHero
          eyebrow="Comparison"
          title="TidyPro vs Jobber"
          description="Jobber is a solid all-round field-service tool. TidyPro is built specifically for cleaning businesses — with flat pricing that doesn't punish you for hiring."
          crumbs={[{ label: "vs Jobber", href: "/compare/jobber" }]}
        />

        <section className="bg-white py-16 sm:py-20 dark:bg-slate-950">
          <Container>
            <div className="mx-auto max-w-4xl">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                      <th className="px-5 py-4 font-semibold text-slate-500"> </th>
                      <th className="px-5 py-4 font-bold text-brand-700 dark:text-brand-300">TidyPro</th>
                      <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">Jobber</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((r) => (
                      <tr
                        key={r.label}
                        className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                      >
                        <th className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">
                          {r.label}
                        </th>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                          <span className="flex items-start gap-2">
                            {r.tidyGood ? (
                              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            ) : (
                              <span className="mt-0.5 inline-block h-4 w-4 shrink-0 text-center text-xs leading-4 text-slate-300">
                                —
                              </span>
                            )}
                            {r.tidy}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                          <span className="flex items-start gap-2">
                            {r.otherGood ? (
                              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            ) : (
                              <span className="mt-0.5 inline-block h-4 w-4 shrink-0 text-center text-xs leading-4 text-slate-300">
                                —
                              </span>
                            )}
                            {r.other}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                Comparison based on publicly available plan information, October
                2026. Features and pricing change — check each provider's site
                for the latest details.
              </p>
            </div>
          </Container>
        </section>

        <section className="bg-slate-50 py-16 sm:py-20 dark:bg-slate-900">
          <Container>
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Common questions
              </h2>
              <div className="mt-8 space-y-4">
                {FAQS.map((f) => (
                  <details
                    key={f.q}
                    className="group rounded-xl border border-slate-200 bg-white px-6 py-4 open:shadow-sm dark:border-slate-800 dark:bg-slate-950"
                  >
                    <summary className="cursor-pointer list-none text-base font-semibold text-slate-900 dark:text-slate-100 [&::-webkit-details-marker]:hidden">
                      {f.q}
                    </summary>
                    <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">
                      {f.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </Container>
        </section>

        <Cta />
      </main>
      <Footer />
    </>
  );
}
