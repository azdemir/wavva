import { Container } from "@/components/ui/container";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

/** Consistent hero band for marketing sub-pages. */
export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="bg-gradient-to-b from-brand-50/60 to-white">
      <Container>
        <div className="mx-auto max-w-3xl py-16 text-center sm:py-20">
          <p className="text-sm font-semibold tracking-wide text-brand-600 uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-5 text-lg text-slate-600">{description}</p>
          )}
        </div>
      </Container>
    </section>
  );
}
