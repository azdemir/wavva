import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardContent, CardIcon } from "@/components/ui/card";
import {
  BellIcon,
  CalendarIcon,
  CardIcon as CardPayIcon,
  PortalIcon,
  QuoteIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { getContent } from "@/lib/studio/content";

export type FeatureItem = {
  icon: string;
  title: string;
  description: string;
};

const ICONS: Record<string, React.ReactNode> = {
  calendar: <CalendarIcon />,
  quote: <QuoteIcon />,
  users: <UsersIcon />,
  card: <CardPayIcon />,
  portal: <PortalIcon />,
  bell: <BellIcon />,
};

export async function Features() {
  const [eyebrow, title, description, features] = await Promise.all([
    getContent<string>("home.features.eyebrow"),
    getContent<string>("home.features.title"),
    getContent<string>("home.features.description"),
    getContent<FeatureItem[]>("home.features.items"),
  ]);
  return (
    <section id="features" className="scroll-mt-20 bg-white py-20 sm:py-24 dark:bg-slate-950">
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-md">
              <CardContent>
                <CardIcon>{ICONS[f.icon] ?? <CalendarIcon />}</CardIcon>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {f.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
