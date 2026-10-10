import type { SVGProps } from "react";
import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Cta } from "@/components/marketing/cta";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardContent, CardIcon } from "@/components/ui/card";
import { CheckIcon } from "@/components/ui/icons";
import { FEATURE_LINKS } from "./feature-links";
import { FEATURE_VISUALS } from "./feature-visuals";

type IconComponent = (props: SVGProps<SVGSVGElement>) => React.ReactNode;

export type FeatureFaq = { q: string; a: string };

export type FeatureBenefit = {
  icon: IconComponent;
  title: string;
  body: string;
};

export type FeatureBlock = {
  icon: IconComponent;
  kicker: string;
  title: string;
  body: string;
  bullets: string[];
};

export type FeaturePageConfig = {
  /** Slug under /features — selects the hero visual and "more features". */
  slug: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  /** Optional pill shown under the hero eyebrow (e.g. "Coming soon"). */
  heroBadge?: string;
  introEyebrow: string;
  introTitle: string;
  introBody: string;
  benefits: [FeatureBenefit, FeatureBenefit, FeatureBenefit];
  blocks: FeatureBlock[];
  faqs: FeatureFaq[];
};

/**
 * Shared layout for the dedicated feature pages: hero + product visual,
 * benefit cards, capability blocks, FAQ (with JSON-LD), cross-links, CTA.
 * Keeps every feature page in the same brand voice and structure.
 */
export function FeaturePage({ config }: { config: FeaturePageConfig }) {
  const Visual = FEATURE_VISUALS[config.slug];
  const others = FEATURE_LINKS.filter((f) => f.slug !== config.slug);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />
      <main>
        <PageHero
          eyebrow={config.heroEyebrow}
          title={config.heroTitle}
          description={config.heroDescription}
          badge={config.heroBadge}
          crumbs={[
            { label: "Features", href: "/features" },
            { label: config.heroTitle, href: `/features/${config.slug}` },
          ]}
        />

        {/* Intro + product visual */}
        <section className="bg-white py-16 sm:py-20 dark:bg-slate-950">
          <Container>
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold tracking-wide text-brand-600 dark:text-brand-400 uppercase">
                  {config.introEyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                  {config.introTitle}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                  {config.introBody}
                </p>
                <div className="mt-8 space-y-5">
                  {config.benefits.map((b) => (
                    <div key={b.title} className="flex items-start gap-4">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                        <b.icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {b.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                          {b.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mx-auto w-full max-w-md lg:max-w-none">
                {Visual ? <Visual /> : null}
              </div>
            </div>
          </Container>
        </section>

        {/* Capability blocks */}
        <section className="bg-slate-50 py-16 sm:py-20 dark:bg-slate-900">
          <Container>
            <div className="grid gap-6 md:grid-cols-3">
              {config.blocks.map((block) => (
                <Card key={block.title} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col">
                    <CardIcon>
                      <block.icon />
                    </CardIcon>
                    <p className="text-xs font-bold tracking-widest text-brand-600 uppercase dark:text-brand-400">
                      {block.kicker}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {block.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {block.body}
                    </p>
                    <ul className="mt-4 space-y-2.5">
                      {block.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400"
                        >
                          <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section className="bg-white py-16 sm:py-20 dark:bg-slate-950">
          <Container>
            <div className="mx-auto max-w-3xl">
              <SectionHeading
                eyebrow="FAQ"
                title="Common questions"
                description={`Everything owners ask us about ${config.heroTitle.toLowerCase()} in TidyPro.`}
              />
              <div className="mt-10 space-y-4">
                {config.faqs.map((f) => (
                  <details
                    key={f.q}
                    className="group rounded-xl border border-slate-200 bg-white px-6 py-4 open:shadow-sm dark:border-slate-800 dark:bg-slate-950"
                  >
                    <summary className="cursor-pointer list-none text-base font-semibold text-slate-900 dark:text-slate-100 [&::-webkit-details-marker]:hidden">
                      {f.q}
                    </summary>
                    <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">
                      {f.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Cross-links */}
        <section className="border-t border-slate-100 bg-slate-50 py-16 sm:py-20 dark:border-slate-800 dark:bg-slate-900">
          <Container>
            <SectionHeading
              eyebrow="Keep exploring"
              title="More ways TidyPro helps"
              description="Every feature works together — scheduling feeds invoicing, checklists feed quality, and reminders keep it all paid."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((f) => (
                <Link
                  key={f.slug}
                  href={f.href}
                  className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900 group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">
                      {f.title} →
                    </span>
                    <span className="mt-1 block text-[13px] leading-snug text-slate-500 dark:text-slate-400">
                      {f.blurb}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        <Cta />
      </main>
      <Footer />
    </>
  );
}
