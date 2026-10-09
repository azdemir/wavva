import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { getContent } from "@/lib/studio/content";

export type HowStep = { title: string; description: string };

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
      className="scroll-mt-20 bg-slate-50 dark:bg-slate-900 py-20 sm:py-24"
    >
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Card key={s.title}>
              <CardContent>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {s.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
