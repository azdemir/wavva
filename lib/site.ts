/**
 * Central site configuration and marketing copy.
 */

export const site = {
  name: "Switchboard",
  tagline: "The AI front office for every business",
  description:
    "Switchboard answers every call in your business's name, books appointments, follows up quotes, and collects invoices — one flat monthly fee.",
  email: "hello@switchboard.example",
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

import { PLANS, PLAN_IDS } from "./plans";

export type Plan = {
  name: string;
  price: number;
  blurb: string;
  cta: string;
  featured?: boolean;
  features: string[];
};

/**
 * Marketing plans, derived from the single source of truth in lib/plans.ts
 * (which also drives the dashboard billing page, seat limits, and feature
 * gating) so the landing page can never drift from the dashboard again.
 */
export const plans: Plan[] = PLAN_IDS.map((id) => {
  const p = PLANS[id];
  return {
    name: p.name,
    price: p.priceCents / 100,
    blurb: p.blurb,
    cta: id === "pro" ? "Talk to us" : "Start free trial",
    featured: id === "growth",
    features: p.features,
  };
});

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
