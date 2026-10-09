import { Suspense } from "react";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ArrowRightIcon, PlayIcon } from "@/components/ui/icons";
import { DashboardTour } from "@/components/marketing/dashboard-tour";
import { HeroBadge } from "@/components/marketing/hero-badge";
import { HeroHeadlines } from "@/components/marketing/hero-headlines";
import { Ambient } from "@/components/marketing/ambient";
import { getSessionUser } from "@/lib/auth";
import { getContent } from "@/lib/studio/content";

/** Session-aware hero CTA. Streams in after the static shell. */
async function HeroCta() {
  await cookies();
  const user = await getSessionUser();
  return user ? (
    <Button href="/dashboard" size="xl" className="group rounded-full">
      Go to dashboard
      <ArrowRightIcon className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
    </Button>
  ) : (
    <Button href="/demo" size="xl" className="group rounded-full">
      Start free trial
      <ArrowRightIcon className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
    </Button>
  );
}

function HeroCtaFallback() {
  return (
    <span
      className="inline-flex h-14 w-48 animate-pulse rounded-full bg-surface-3"
      aria-hidden="true"
    />
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
    <section className="relative isolate -mt-[4.5rem] overflow-hidden bg-surface pt-[4.5rem]">
      <Ambient />

      <Container className="relative">
        <div className="grid items-center gap-14 pt-16 pb-16 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10 lg:pt-28 lg:pb-28">
          {/* ---------------------------------------------------------- Copy */}
          <div className="animate-fade-up">
            <HeroHeadlines staticLine={staticLine} dynamicLines={dynamicLines} />

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-pretty text-ink-2">
              {subcopy}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Suspense fallback={<HeroCtaFallback />}>
                <HeroCta />
              </Suspense>
              <Button
                href="#how-it-works"
                variant="outline"
                size="xl"
                className="group rounded-full"
              >
                <PlayIcon className="h-4 w-4" />
                See how it works
              </Button>
            </div>

            <p className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-ink-3">
              {trialNote.split("·").map((part, i) => (
                <span key={i} className="flex items-center gap-2.5">
                  {i > 0 && (
                    <span aria-hidden="true" className="text-line-strong">
                      ·
                    </span>
                  )}
                  {part.trim()}
                </span>
              ))}
            </p>
          </div>

          {/* ------------------------------------------------------- Product */}
          {showTour && (
            <div className="animate-fade-in relative min-w-0 lg:[perspective:2000px]">
              <div className="relative lg:[transform:rotateX(4deg)_rotateY(-7deg)_rotateZ(1deg)] lg:[transform-style:preserve-3d]">
                <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-brand-500/20 via-brand-400/10 to-accent-400/20 blur-3xl dark:from-brand-600/25 dark:to-accent-500/15" />
                <DashboardTour />
              </div>
              {/* Floats in the hero's empty margin ABOVE the frame, never
                  over it — the old lower-left position collided with the
                  tour caption at tablet widths. */}
              <HeroBadge className="absolute -top-8 right-3 z-10 lg:-top-10 lg:right-2" />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}