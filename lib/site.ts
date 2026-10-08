/**
 * Central site configuration and marketing copy.
 * "TidyPro" is a working title — rename here and it updates across the marketing site.
 */

export const site = {
  name: "TidyPro",
  tagline: "Operations software for cleaning businesses",
  description:
    "TidyPro helps residential and commercial cleaning businesses manage quotes, scheduling, teams, invoices, and customers in one simple place.",
  email: "hello@tidypro.example",
  cities: [
    "Albany",
    "Saratoga Springs",
    "Schenectady",
    "Troy",
    "Syracuse",
    "Rochester",
    "Buffalo",
  ],
} as const;

export type Plan = {
  name: string;
  price: number;
  blurb: string;
  cta: string;
  featured?: boolean;
  features: string[];
};

/** Suggested pricing — shown for illustration; final plans confirmed at launch. */
export const plans: Plan[] = [
  {
    name: "Starter",
    price: 49,
    blurb: "For solo cleaners getting organized.",
    cta: "Start free trial",
    features: [
      "1 user",
      "Up to 50 active customers",
      "Quotes & bookings",
      "Basic invoicing",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: 99,
    blurb: "For growing teams winning more jobs.",
    cta: "Start free trial",
    featured: true,
    features: [
      "Up to 5 users",
      "Unlimited customers",
      "Recurring bookings",
      "Customer portal",
      "Crew scheduling & conflict alerts",
      "Priority support",
    ],
  },
  {
    name: "Pro",
    price: 199,
    blurb: "For established companies running crews.",
    cta: "Talk to us",
    features: [
      "Unlimited users",
      "Multi-crew scheduling",
      "Before/after photo uploads",
      "Business reports",
      "Dedicated onboarding",
    ],
  },
];

export type Faq = { q: string; a: string };

export const faqs: Faq[] = [
  {
    q: "Is TidyPro only for cleaning businesses in Upstate New York?",
    a: "We designed TidyPro with Upstate cleaners in mind — service areas by city, county, ZIP code, or radius, Eastern Time scheduling, and USD pricing. But any residential or commercial cleaning business in the US can use it.",
  },
  {
    q: "I'm not technical. Is it hard to set up?",
    a: "No. A guided setup walks you through your business profile, services, pricing, and service area, then helps you invite your team. Most owners finish in under 30 minutes, and there's no software to install.",
  },
  {
    q: "How do my customers pay me?",
    a: "You create and send invoices from TidyPro, and customers pay by card through their customer portal. Payments go directly to your business account — completely separate from your TidyPro subscription.",
  },
  {
    q: "Does TidyPro handle sales tax for me?",
    a: "You can configure tax rates on your invoices, but tax rules vary by location and situation. Have your accountant verify what's required for your business — we don't assume tax requirements on your behalf.",
  },
  {
    q: "Can my cleaners use it on their phones?",
    a: "Yes. Job views are designed mobile-first: cleaners see their day's jobs, tap into job details, work through checklists, upload before-and-after photos, and mark jobs complete — all from a phone browser.",
  },
];
