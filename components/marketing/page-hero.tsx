import { Container } from "@/components/ui/container";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

/** Consistent hero band for marketing sub-pages. */
export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="bg-gradient-to-b from-brand-50/60 to-white dark:from-brand-950/50 dark:to-slate-950">
      <Container>
        <div className="mx-auto max-w-3xl py-16 text-center sm:py-20">
          <p className="text-sm font-semibold tracking-wide text-brand-600 dark:text-brand-400 uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-5 text-lg text-slate-600 dark:text-slate-400">{description}</p>
          )}
        </div>
      </Container>
    </section>
  );
}
