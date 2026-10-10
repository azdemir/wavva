import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Cta } from "@/components/marketing/cta";
import { PageHero } from "@/components/marketing/page-hero";
import { FEATURE_LINKS } from "@/components/marketing/feature-links";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardContent, CardIcon } from "@/components/ui/card";
import {

  BellIcon,
  CalendarIcon,
  CardIcon as CardPayIcon,
  CheckIcon,
  PortalIcon,
  QuoteIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { getContent } from "@/lib/studio/content";

export const metadata: Metadata = {
  title: "Cleaning Business Software Features",
  description:
    "Cleaning business software features: scheduling without double-bookings, quotes that convert to bookings, crew mobile tools, invoicing with online payments, customer portal, and automated reminders.",
  alternates: { canonical: "/features" },
};

type DeepDive = {
  icon: string;
  title: string;
  description: string;
  bullets: string[];
};

type Audience = { title: string; description: string };

const ICONS: Record<string, React.ReactNode> = {
  calendar: <CalendarIcon />,
  quote: <QuoteIcon />,
  users: <UsersIcon />,
  card: <CardPayIcon />,
  portal: <PortalIcon />,
  bell: <BellIcon />,
};

/** Deep-dive cards link out to the dedicated feature pages. */
const DEEP_DIVE_LINKS: Record<string, string> = {
  calendar: "/features/scheduling",
  quote: "/features/online-booking",
  users: "/features/cleaner-checklist",
  card: "/features/invoicing-billing",
  portal: "/features/online-booking",
  bell: "/features/automated-communications",
};

export default async function FeaturesPage() {
  const [
    heroEyebrow,
    heroTitle,
    heroDescription,
    deepDives,
    audEyebrow,
    audTitle,
    audDescription,
    audiences,
  ] = await Promise.all([
    getContent<string>("features.hero.eyebrow"),
    getContent<string>("features.hero.title"),
    getContent<string>("features.hero.description"),
    getContent<DeepDive[]>("features.deep_dives"),
    getContent<string>("features.audiences.eyebrow"),
    getContent<string>("features.audiences.title"),
    getContent<string>("features.audiences.description"),
    getContent<Audience[]>("features.audiences.items"),
  ]);

  return (
    <>
      <Navbar />
      <main>
        <PageHero
          eyebrow={heroEyebrow}
          title={heroTitle}
          description={heroDescription}
          crumbs={[{ label: "Features", href: "/features" }]}
        />

        <section className="bg-white py-16 sm:py-20 dark:bg-slate-950">
          <Container>
            <div className="grid gap-6 md:grid-cols-2">
              {deepDives.map((f) => (
                <Card key={f.title} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col">
                    <CardIcon>{ICONS[f.icon] ?? <CalendarIcon />}</CardIcon>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {f.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {f.description}
                    </p>
                    <ul className="mt-4 space-y-2.5">
                      {f.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400"
                        >
                          <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    {DEEP_DIVE_LINKS[f.icon] && (
                      <Link
                        href={DEEP_DIVE_LINKS[f.icon]}
                        className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                      >
                        Learn more →
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900 py-16 sm:py-20">
          <Container>
            <SectionHeading
              eyebrow="Feature index"
              title="Explore every feature"
              description="Deep dives on each part of TidyPro — how it works, why it matters, and the questions owners ask."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURE_LINKS.map((f) => (
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
                      {f.slug === "mobile-app" && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[11px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Coming soon
                        </span>
                      )}
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

        <section className="bg-white dark:bg-slate-950 py-16 sm:py-20">
          <Container>
            <SectionHeading
              eyebrow={audEyebrow}
              title={audTitle}
              description={audDescription}
            />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {audiences.map((a) => (
                <Card key={a.title}>
                  <CardContent>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {a.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {a.description}
                    </p>
                  </CardContent>
                </Card>
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
