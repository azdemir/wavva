import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Cta } from "@/components/marketing/cta";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/logo";
import { formatPrice, PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Compare TidyPro",
  description:
    "Compare TidyPro with Jobber, Housecall Pro, ZenMaid, and BookingKoala. Find the right fit for your cleaning business with a clear look at each platform's focus.",
  alternates: { canonical: "/compare" },
};

const COMPARISONS = [
  {
    id: "jobber",
    name: "Jobber",
    monogram: "J",
    category: "Field service",
    headline: "An all-rounder for service businesses.",
    focus: "Quotes, scheduling, invoicing, and payments for home and commercial service businesses across different trades.",
    tidy: "A dedicated workspace for residential and commercial cleaning, with quotes, bookings, customers, and invoices together.",
    consider: "Compare the tools and team capacity included in the plan you would actually use.",
    tags: ["Quotes & invoices", "Multiple trades"],
    website: "https://www.getjobber.com/",
    gradient: "from-emerald-700 to-teal-700",
    tint: "bg-emerald-50 dark:bg-emerald-950/30",
    accent: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-900",
  },
  {
    id: "housecall-pro",
    name: "Housecall Pro",
    monogram: "H",
    category: "Field service",
    headline: "A broad platform for home-service growth.",
    focus: "A field-service management platform built to help service businesses organize operations and scale.",
    tidy: "Cleaning-focused workflows without having to adapt a multi-trade workspace to your daily cleaning operations.",
    consider: "Decide whether you need a broad field-service toolkit or a more focused cleaning workspace.",
    tags: ["Service operations", "Business growth"],
    website: "https://www.housecallpro.com/features/",
    gradient: "from-sky-700 to-blue-700",
    tint: "bg-sky-50 dark:bg-sky-950/30",
    accent: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-900",
  },
  {
    id: "zenmaid",
    name: "ZenMaid",
    monogram: "Z",
    category: "Maid service",
    headline: "Made for the rhythm of a maid service.",
    focus: "Maid-service scheduling, automated communications, instant booking forms, invoicing, and a mobile app for cleaners.",
    tidy: "Another cleaning-specific option, with a quote-to-booking workflow, customer portal, and automated quote follow-up on Growth and Pro.",
    consider: "Both focus on cleaning. Compare the booking workflow, communication tools, and plan limits that suit your team.",
    tags: ["Maid scheduling", "Automated reminders"],
    website: "https://get.zenmaid.com/",
    gradient: "from-violet-600 to-purple-700",
    tint: "bg-violet-50 dark:bg-violet-950/30",
    accent: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-900",
  },
  {
    id: "bookingkoala",
    name: "BookingKoala",
    monogram: "B",
    category: "Service booking",
    headline: "A booking-led approach to growing a service.",
    focus: "Service-business booking with customer-experience tools such as SMS reminders, gift cards, and marketplace opportunities.",
    tidy: "An operations-first workspace for managing cleaning customers, quotes, bookings, teams, and invoices.",
    consider: "Weigh booking and customer-acquisition tools against the day-to-day operations your team needs.",
    tags: ["Customer bookings", "Customer experience"],
    website: "https://www.bookingkoala.com/",
    gradient: "from-orange-700 to-rose-700",
    tint: "bg-orange-50 dark:bg-orange-950/30",
    accent: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-900",
  },
];

export default function CompareIndexPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          eyebrow="Comparisons"
          title="How TidyPro compares"
          description="Four popular alternatives. Four different approaches. Find the fit for your cleaning business — without the feature-checklist guesswork."
          crumbs={[{ label: "Compare", href: "/compare" }]}
        />
        <section className="bg-surface py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-5xl">
              <div className="mb-10 flex flex-col gap-6 rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-emerald-50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 dark:border-brand-900 dark:from-brand-950 dark:via-slate-900 dark:to-emerald-950/40">
                <div className="flex items-start gap-4">
                  <LogoMark className="h-12 w-12 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase dark:text-brand-300">
                      The TidyPro approach
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                      One tidy place for your cleaning business.
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-3">
                      Plans from {formatPrice(PLANS.basic.priceCents)}/month.
                      Team capacity varies by plan; Pro includes unlimited users.
                    </p>
                  </div>
                </div>
                <Link
                  href="/pricing"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
                >
                  Explore our plans <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>

              <nav aria-label="Jump to a competitor" className="mb-8 flex flex-wrap gap-2">
                {COMPARISONS.map((c) => (
                  <a
                    key={c.id}
                    href={`#${c.id}`}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600 ${c.tint} ${c.accent} ${c.border}`}
                  >
                    {c.name}
                  </a>
                ))}
              </nav>

              <div className="grid gap-6 lg:grid-cols-2">
              {COMPARISONS.map((c) => (
                <article
                  key={c.id}
                  id={c.id}
                  className={`flex scroll-mt-28 flex-col overflow-hidden rounded-3xl border bg-surface shadow-sm ${c.border}`}
                >
                  <div className={`bg-gradient-to-br p-6 text-white sm:p-7 ${c.gradient}`}>
                    <div className="flex items-center justify-between gap-4">
                      <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/15 text-2xl font-bold">
                        {c.monogram}
                      </span>
                      <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-medium">
                        {c.category}
                      </span>
                    </div>
                    <h3 className="mt-5 text-2xl font-bold tracking-tight">
                      TidyPro vs {c.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed">{c.headline}</p>
                  </div>
                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <div className="mb-6 flex flex-wrap gap-2">
                      {c.tags.map((tag) => (
                        <span key={tag} className={`rounded-full px-3 py-1 text-xs font-medium ${c.tint} ${c.accent}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <dl className="space-y-5 pb-6 text-sm">
                      <div>
                        <dt className={`font-semibold ${c.accent}`}>{c.name}&apos;s focus</dt>
                        <dd className="mt-2 leading-relaxed text-ink-3">{c.focus}</dd>
                      </div>
                      <div className="rounded-2xl border border-line bg-surface-2 p-4">
                        <dt className="flex items-center gap-2 font-semibold text-ink">
                          <CheckIcon className="h-4 w-4 text-accent-600 dark:text-accent-400" />
                          Where TidyPro fits
                        </dt>
                        <dd className="mt-2 leading-relaxed text-ink-2">{c.tidy}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-ink">What to weigh up</dt>
                        <dd className="mt-2 leading-relaxed text-ink-3">{c.consider}</dd>
                      </div>
                    </dl>
                    <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-5">
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600 ${c.accent}`}
                      >
                        {c.name} official site
                        <ArrowRightIcon className="h-4 w-4 -rotate-45" />
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                      {c.id === "jobber" && (
                        <Link href="/compare/jobber" className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600">
                          Detailed comparison <ArrowRightIcon className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              ))}
              </div>
              <p className="mt-8 max-w-3xl text-xs leading-relaxed text-ink-3">
                Overview based on official provider websites reviewed in October 2026.
                Features, pricing, and plan limits can change. Check each provider
                for current details. Brand names belong to their respective owners;
                no affiliation or endorsement is implied.
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
