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

export const metadata: Metadata = {
  title: "Features",
  description:
    "Scheduling, quotes and bookings, crew tools, invoicing and payments, customer portal, and reminders — everything TidyPro does for cleaning businesses.",
};

const deepDives = [
  {
    icon: <CalendarIcon />,
    title: "Scheduling without double-bookings",
    description:
      "A calendar built for cleaning work: see the day, week, or month, assign cleaners or crews, and let TidyPro warn you before two jobs collide.",
    bullets: [
      "Day, week, and month views with crew assignments",
      "Automatic conflict warnings on overlapping jobs",
      "Job statuses: scheduled, in progress, completed, canceled",
    ],
  },
  {
    icon: <QuoteIcon />,
    title: "Quotes that turn into bookings",
    description:
      "Win work faster with an online quote-request form and pricing that adapts to each job. Approved quotes become bookings in one click.",
    bullets: [
      "Shareable online quote-request form",
      "Pricing by service, property size, frequency, and add-ons",
      "One-time and recurring bookings; configurable cancellation rules",
    ],
  },
  {
    icon: <UsersIcon />,
    title: "Crew tools for the field",
    description:
      "Your cleaners get a mobile-first view of their day — job details, checklists, and photos — without paperwork to bring home.",
    bullets: [
      "Today's jobs with addresses and access instructions on any phone",
      "Completion checklists for consistent quality",
      "Optional before-and-after photo uploads",
    ],
  },
  {
    icon: <CardPayIcon />,
    title: "Invoicing and online payments",
    description:
      "Send invoices the moment a job is done and watch them get paid. Customer payments go straight to your business — separate from your TidyPro subscription.",
    bullets: [
      "Create, send, and track invoices; see what's overdue at a glance",
      "Customers pay by card through their portal (Stripe Connect)",
      "Configurable tax settings — have your accountant verify requirements",
    ],
  },
  {
    icon: <PortalIcon />,
    title: "A portal your customers will actually use",
    description:
      "Give clients a simple login where they can handle everything themselves — fewer phone calls and emails for you.",
    bullets: [
      "Approve quotes online",
      "View upcoming and past appointments; request rescheduling",
      "View and pay invoices; update contact details and preferences",
    ],
  },
  {
    icon: <BellIcon />,
    title: "Reminders that reduce no-shows",
    description:
      "Automatic, well-timed messages keep everyone in the loop — customers show up ready, and crews know where to be.",
    bullets: [
      "Booking confirmations and reminders",
      "Quote, invoice, and staff-assignment notifications",
      "Email now with consent controls; optional SMS in a later release",
    ],
  },
];

const audiences = [
  {
    title: "Owners & managers",
    description:
      "Today's jobs, new quote requests, and outstanding invoices on one dashboard. Run the business in minutes a day — not late evenings.",
  },
  {
    title: "Cleaners",
    description:
      "Your day's jobs on your phone with checklists and one-tap completion. No apps to install, no paperwork to bring home.",
  },
  {
    title: "Customers",
    description:
      "Approve quotes, pay invoices, and reschedule online at midnight if they want. No phone tag, no waiting on hold.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          eyebrow="Features"
          title="Everything you need to run your cleaning business"
          description="One workspace for quotes, scheduling, crews, invoices, and customers — designed for owners who'd rather be cleaning than clicking."
        />

        <section className="bg-white py-16 sm:py-20">
          <Container>
            <div className="grid gap-6 md:grid-cols-2">
              {deepDives.map((f) => (
                <Card key={f.title}>
                  <CardContent>
                    <CardIcon>{f.icon}</CardIcon>
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
              eyebrow="Who it's for"
              title="Built for everyone who touches the job"
              description="Owners, cleaners, and customers each get an experience designed around what they actually do."
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
