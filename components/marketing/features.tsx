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

const features = [
  {
    icon: <CalendarIcon />,
    title: "Scheduling without double-bookings",
    description:
      "Day, week, and month views with crew assignments and automatic conflict warnings — so no two jobs land on the same crew at the same time.",
  },
  {
    icon: <QuoteIcon />,
    title: "Quotes that turn into bookings",
    description:
      "Take quote requests online, price by service, property size, frequency, and add-ons, then convert an approved quote into a booking in one click.",
  },
  {
    icon: <UsersIcon />,
    title: "Crew tools for the field",
    description:
      "Cleaners see their day's jobs on their phones, work through checklists, upload before-and-after photos, and mark jobs complete from the job site.",
  },
  {
    icon: <CardPayIcon />,
    title: "Invoicing and online payments",
    description:
      "Create and send invoices, track payment status, and let customers pay by card. Customer payments go to your business — separate from your TidyPro subscription.",
  },
  {
    icon: <PortalIcon />,
    title: "A portal your customers will actually use",
    description:
      "Clients approve quotes, view upcoming and past appointments, request reschedules, pay invoices, and update their preferences — without calling you.",
  },
  {
    icon: <BellIcon />,
    title: "Reminders that reduce no-shows",
    description:
      "Automatic booking confirmations, reminders, and staff assignment notifications by email, with consent controls and notification preferences.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Features"
          title="Everything a cleaning business needs, nothing it doesn't"
          description="One workspace for winning customers, running jobs, and getting paid — simple enough for owners who'd rather be cleaning than clicking."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-md">
              <CardContent>
                <CardIcon>{f.icon}</CardIcon>
                <h3 className="text-lg font-semibold text-slate-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
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
