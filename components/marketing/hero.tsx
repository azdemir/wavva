import { Suspense } from "react";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { DashboardTour } from "@/components/marketing/dashboard-tour";
import { HeroBadge } from "@/components/marketing/hero-badge";
import { HeroHeadlines } from "@/components/marketing/hero-headlines";
import { getSessionUser } from "@/lib/auth";
import { getContent } from "@/lib/studio/content";

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

export async function Hero() {
  const [staticLine, dynamicLines, subcopy, trialNote, showTour] =
    await Promise.all([
      getContent<string>("home.hero.static_line"),
      getContent<string[]>("home.hero.dynamic_lines"),
      getContent<string>("home.hero.subcopy"),
      getContent<string>("home.hero.trial_note"),
      getContent<boolean>("home.hero.show_tour"),
    ]);
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 to-white dark:from-brand-950/50 dark:to-slate-950">
      <Container>
        <div className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <HeroHeadlines staticLine={staticLine} dynamicLines={dynamicLines} />

            <p className="mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-400">
              {subcopy}
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
              {trialNote}
            </p>
          </div>

          {/* Auto-playing dashboard tour — sample data, not a screenshot */}
          {showTour && (
            <div className="animate-fade-in relative min-w-0">
              <DashboardTour />
              <HeroBadge className="absolute bottom-10 -left-2 z-10 sm:bottom-12 sm:-left-5" />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
