import { Suspense } from "react";
import { cookies } from "next/headers";
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
        <div className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <HeroHeadlines />

            <p className="mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-400">
              Quotes, scheduling, crew, invoices, and customer messages — in one
              simple workspace for every cleaning company.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
          <div className="animate-fade-in min-w-0">
            <DashboardTour />
          </div>
        </div>
      </Container>
    </section>
  );
}
