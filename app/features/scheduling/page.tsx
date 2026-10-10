import type { Metadata } from "next";
import { FeaturePage, type FeaturePageConfig } from "@/components/marketing/feature-page";
import {
  BellIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Cleaning Business Scheduling Software — TidyPro",
  description:
    "TidyPro scheduling: a calendar built for cleaning work with day, week, and month views, crew assignments, conflict warnings, and recurring bookings that run on autopilot.",
  alternates: { canonical: "/features/scheduling" },
};

const config: FeaturePageConfig = {
  slug: "scheduling",
  heroEyebrow: "Features",
  heroTitle: "Scheduling",
  heroDescription:
    "One calendar for every job, cleaner, and recurring visit — with conflict warnings before two jobs collide.",
  introEyebrow: "Why it matters",
  introTitle: "Ditch the whiteboard, the group chat, and the double-bookings",
  introBody:
    "Scheduling is the heartbeat of a cleaning business, and it's usually managed in three different apps plus someone's memory. TidyPro gives the whole team one calendar that stays in sync — so the day runs itself and you stop playing dispatcher.",
  benefits: [
    {
      icon: CalendarIcon,
      title: "Every visit in one place",
      body: "Day, week, and month views show every scheduled, in-progress, and completed job. Add a booking to any day with the quick-add button.",
    },
    {
      icon: BellIcon,
      title: "No more overlaps",
      body: "TidyPro warns you when a cleaner is assigned to two jobs at once, booked during time off, or scheduled outside their availability hours.",
    },
    {
      icon: ClockIcon,
      title: "Recurring clients on autopilot",
      body: "Weekly, biweekly, and monthly routes repeat automatically. Set the pattern once and every future visit appears on the calendar.",
    },
  ],
  blocks: [
    {
      icon: CalendarIcon,
      kicker: "Calendar",
      title: "A calendar built for cleaning work",
      body: "Color-coded status pills make the whole day readable at a glance — blue for scheduled, amber for in progress, green for completed — with today's column highlighted.",
      bullets: [
        "Day, week, and month views with crew assignments",
        "Quick-add button on any day to create a booking instantly",
        "Job statuses: scheduled, in progress, completed, canceled",
      ],
    },
    {
      icon: CheckIcon,
      kicker: "Crew",
      title: "Crew assignments with conflict warnings",
      body: "Assign one cleaner or a whole crew to a job. If someone is on approved time off or outside their weekly availability, TidyPro flags it before you confirm.",
      bullets: [
        "Assign individual cleaners or crews to any job",
        "Automatic warnings for PTO and availability conflicts",
        "Cleaners see their own jobs with addresses and instructions",
      ],
    },
    {
      icon: ClockIcon,
      kicker: "Recurring",
      title: "Recurring schedules, set once",
      body: "Regular clients are the backbone of a cleaning business. Define the frequency once and TidyPro generates every future visit — customers can even see upcoming visits in their portal.",
      bullets: [
        "Weekly, biweekly, monthly, and custom repeat patterns",
        "One-time and recurring bookings with configurable cancellation rules",
        "Upcoming visits visible to customers in the client portal",
      ],
    },
  ],
  faqs: [
    {
      q: "How do recurring bookings work?",
      a: "When you create a booking, choose a repeat pattern — weekly, biweekly, monthly, or custom. TidyPro generates the future visits on your calendar automatically, and each one gets its own job with checklist and crew assignment.",
    },
    {
      q: "What happens if I accidentally double-book a cleaner?",
      a: "TidyPro checks every assignment against the cleaner's existing jobs, approved time off, and weekly availability hours. If there's a conflict, you'll see a warning on the job page before you confirm — so overlaps get caught, not discovered at the door.",
    },
    {
      q: "Can my cleaners see their schedule?",
      a: "Yes. Each team member gets a mobile-friendly My Jobs view showing their upcoming visits with addresses, access instructions, and checklists — no app download or extra login hassle.",
    },
    {
      q: "Is the Schedule available on every plan?",
      a: "The full Schedule with week/month views, crew assignment, and conflict warnings is included on Growth and Pro plans. Starter focuses on customers, quotes, bookings, and invoices.",
    },
  ],
};

export default function SchedulingPage() {
  return <FeaturePage config={config} />;
}
