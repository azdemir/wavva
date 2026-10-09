import { Suspense } from "react";
import { cookies } from "next/headers";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { DashboardTour } from "@/components/marketing/dashboard-tour";
import { HeroHeadlines } from "@/components/marketing/hero-headlines";
import { getSessionUser } from "@/lib/auth";

/** Session-aware hero CTA. Streams in after the static shell. */
async function HeroCta() {
  await cookies();
  const user = await getSessionUser();
  return user ? (
    <Button href="/dashboard" size="lg">
      Go to dashboard
      <ArrowRightIcon className="h-5 w-5" />
    </Button>
  ) : (
    <Button href="/demo" size="lg">
      Start free trial
      <ArrowRightIcon className="h-5 w-5" />
    </Button>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 to-white dark:from-brand-950/50 dark:to-slate-950">
      <Container>
        <div className="mx-auto max-w-4xl pt-16 pb-12 text-center lg:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300">
            <span className="inline-block h-2 w-2 rounded-full bg-brand-500" aria-hidden="true" />
            Proudly locally owned in Upstate New York
          </p>

          <div className="mt-6 animate-fade-up">
            <HeroHeadlines />
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Quotes, scheduling, crew, invoices, and customer messages — in one
            simple workspace for every cleaning company.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Suspense
              fallback={
                <span className="inline-flex h-12 w-40 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" aria-hidden="true" />
              }
            >
              <HeroCta />
            </Suspense>
            <Button href="#how-it-works" variant="outline" size="lg">
              See how it works
            </Button>
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Free 14-day trial · No credit card required · Cancel anytime
          </p>
        </div>

        {/* Auto-playing dashboard tour — sample data, not a screenshot */}
        <div className="mx-auto max-w-5xl pb-16 animate-fade-in">
          <DashboardTour />
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 py-8">
          <p className="text-center text-xs font-semibold tracking-widest text-slate-400 uppercase">
            Set your service area anywhere — for example
          </p>
          <p className="mt-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            {site.cities.join("  ·  ")}
          </p>
        </div>
      </Container>
    </section>
  );
}
