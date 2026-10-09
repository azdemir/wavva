import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Cta } from "@/components/marketing/cta";
import { PageHero } from "@/components/marketing/page-hero";
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
                <Card key={f.title}>
                  <CardContent>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900 py-16 sm:py-20">
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
