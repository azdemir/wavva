import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { getContent } from "@/lib/studio/content";

export type HowStep = { title: string; description: string };

/** Short reassurance chips — answers the fear, not the feature. */
const REASSURANCE = [
  "No software to install",
  "Setup in under 30 minutes",
  "Cancel anytime",
];

export async function HowItWorks() {
  const [eyebrow, title, description, steps] = await Promise.all([
    getContent<string>("home.how.eyebrow"),
    getContent<string>("home.how.title"),
    getContent<string>("home.how.description"),
    getContent<HowStep[]>("home.how.steps"),
  ]);

  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-y border-line bg-surface-2 py-24 sm:py-28 lg:py-32"
    >
      <Container>
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* Sticky rail ------------------------------------------------- */}
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading align="left" eyebrow={eyebrow} title={title} />

            <p className="mt-5 max-w-md text-lg leading-relaxed text-pretty text-ink-2">
              {description}
            </p>

            <ul className="mt-8 space-y-3">
              {REASSURANCE.map((r) => (
                <li
                  key={r}
                  className="flex items-center gap-3 text-sm text-ink-2"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700 dark:bg-accent-950 dark:text-accent-400">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  {r}
                </li>
              ))}
            </ul>

            <Button href="/demo" size="lg" className="mt-9 rounded-full">
              Start your free trial
            </Button>
          </Reveal>

          {/* Steps -------------------------------------------------------- */}
          <ol className="relative">
            <span
              aria-hidden="true"
              className="absolute top-4 bottom-4 left-[1.375rem] w-px bg-gradient-to-b from-brand-400 via-line to-transparent lg:left-[1.625rem]"
            />
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 110} className="relative">
                <div className="flex gap-6 pb-12 last:pb-0">
                  <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface font-display text-lg text-ink shadow-sm lg:h-13 lg:w-13">
                    {i + 1}
                  </span>
                  <div className="min-w-0 pt-1">
                    <h3 className="text-xl leading-snug font-semibold text-balance text-ink sm:text-2xl">
                      {s.title}
                    </h3>
                    <p className="mt-3 max-w-xl leading-relaxed text-pretty text-ink-2">
                      {s.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}