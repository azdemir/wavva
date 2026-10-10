import type { SVGProps } from "react";
import {
  BellIcon,
  CalendarIcon,
  CardIcon,
  CheckIcon,
  PhoneIcon,
  PortalIcon,
  QuoteIcon,
} from "@/components/ui/icons";

export type FeatureLink = {
  /** URL slug under /features (also used as the item key). */
  slug: string;
  href: string;
  title: string;
  blurb: string;
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactNode;
};

/**
 * Single source of truth for the marketing feature nav: the navbar dropdown,
 * the mobile accordion, the /features overview, and the "more features" band
 * on each feature page all render from this list.
 */
export const FEATURE_LINKS: FeatureLink[] = [
  {
    slug: "scheduling",
    href: "/features/scheduling",
    title: "Scheduling",
    blurb: "One calendar for every job, cleaner, and recurring visit.",
    icon: CalendarIcon,
  },
  {
    slug: "automated-communications",
    href: "/features/automated-communications",
    title: "Automated Communications",
    blurb: "Confirmations, reminders, and follow-ups sent on their own.",
    icon: BellIcon,
  },
  {
    slug: "online-booking",
    href: "/features/online-booking",
    title: "Online Booking Forms",
    blurb: "Turn your website into a 24/7 booking desk.",
    icon: PortalIcon,
  },
  {
    slug: "invoicing-billing",
    href: "/features/invoicing-billing",
    title: "Invoicing & Billing",
    blurb: "Professional invoices with automatic payment reminders.",
    icon: QuoteIcon,
  },
  {
    slug: "credit-card-processing",
    href: "/features/credit-card-processing",
    title: "Credit Card Processing",
    blurb: "Secure online payments powered by Stripe.",
    icon: CardIcon,
  },
  {
    slug: "mobile-app",
    href: "/features/mobile-app",
    title: "Mobile App",
    blurb: "Cleaners' schedules and checklists, in their pocket — coming soon.",
    icon: PhoneIcon,
  },
  {
    slug: "cleaner-checklist",
    href: "/features/cleaner-checklist",
    title: "Checklist Templates",
    blurb: "Reusable templates so every clean meets your standard.",
    icon: CheckIcon,
  },
];
