import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tidy-pro.vercel.app";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  /** Breadcrumb trail labels; "Home" is prepended automatically. */
  crumbs?: { label: string; href: string }[];
  /** Optional pill rendered under the eyebrow (e.g. "Coming soon"). */
  badge?: string;
};

/** Consistent hero band for marketing sub-pages. */
export function PageHero({ eyebrow, title, description, crumbs, badge }: PageHeroProps) {
  return (
    <section className="bg-gradient-to-b from-brand-50/60 to-white dark:from-brand-950/50 dark:to-slate-950">
      <Container>
        <div className="mx-auto max-w-3xl py-16 text-center sm:py-20">
          {crumbs && crumbs.length > 0 && (
            <div className="mb-6 flex justify-center">
              <Breadcrumbs
                items={[
                  { label: "Home", href: `${SITE_URL}/` },
                  ...crumbs.map((c) => ({
                    label: c.label,
                    href: `${SITE_URL}${c.href}`,
                  })),
                ]}
              />
            </div>
          )}
          <p className="text-sm font-semibold tracking-wide text-brand-600 dark:text-brand-400 uppercase">
            {eyebrow}
          </p>
          {badge && (
            <p className="mt-4">
              <span className="inline-block rounded-full bg-amber-100 px-3.5 py-1.5 text-sm font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {badge}
              </span>
            </p>
          )}
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
