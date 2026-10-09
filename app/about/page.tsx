import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Cta } from "@/components/marketing/cta";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "About TidyPro",
  description:
    "TidyPro is cleaning business software built in Upstate New York — cleaning-first scheduling, quotes, and invoicing with flat pricing and no per-user fees.",
  alternates: { canonical: "/about" },
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tidy-pro.vercel.app";

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TidyPro",
  url: SITE_URL,
  description:
    "Cleaning business software: scheduling, quotes, crew tools, invoicing, and customer portal with flat pricing.",
  areaServed: {
    "@type": "State",
    name: "New York",
  },
  knowsAbout: [
    "Cleaning business scheduling software",
    "Quote follow-up automation",
    "Cleaning company invoicing",
  ],
};

const VALUES = [
  {
    title: "Cleaning-first, not generic",
    body: "Most field-service tools are built for plumbers and HVAC, then retrofitted for cleaners. TidyPro starts from how cleaning businesses actually run: recurring routes, checklists, before/after photos, and quotes that need follow-up.",
  },
  {
    title: "Flat pricing, no per-user fees",
    body: "Hiring your fifth cleaner shouldn't raise your software bill. Every TidyPro plan covers your whole team at one flat monthly price — the way it should be.",
  },
  {
    title: "Built where our customers work",
    body: "TidyPro is built in Upstate New York, for the independent cleaning companies here — in Albany, Syracuse, Rochester, and the towns in between. We answer our own support email.",
  },
];

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
      />
      <Navbar />
      <main>
        <PageHero
          eyebrow="About TidyPro"
          title="Software built for cleaning businesses, by people who know them"
          description="We're a small team in Upstate New York making the operations software we wish every local cleaning company had."
          crumbs={[{ label: "About", href: "/about" }]}
        />

        <section className="bg-white py-16 sm:py-20 dark:bg-slate-950">
          <Container>
            <div className="mx-auto max-w-3xl space-y-6 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              <p>
                TidyPro started with a simple observation: the cleaning
                companies doing great work in Upstate New York were running
                their businesses on a patchwork of text messages,
                spreadsheets, and generic apps that charge more every time
                they hire.
              </p>
              <p>
                So we built the alternative — one tidy workspace for quotes,
                scheduling, crews, invoices, and customers, designed around
                how cleaning businesses actually operate. Recurring
                cleanings, mobile checklists, automated quote follow-up, and
                online payments are built in, not bolted on.
              </p>
              <p>
                We're live across Upstate New York today and expanding to more
                states soon. If you run a residential or commercial cleaning
                business anywhere in the US, TidyPro is ready for you.
              </p>
            </div>
          </Container>
        </section>

        <section className="bg-slate-50 py-16 sm:py-20 dark:bg-slate-900">
          <Container>
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                What we believe
              </h2>
              <div className="mt-8 space-y-8">
                {VALUES.map((v) => (
                  <div key={v.title}>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {v.title}
                    </h3>
                    <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-400">
                      {v.body}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-10">
                <Link
                  href="/demo"
                  className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  Start your free 14-day trial →
                </Link>
              </p>
            </div>
          </Container>
        </section>

        <Cta />
      </main>
      <Footer />
    </>
  );
}
