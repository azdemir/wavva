/**
 * Front Office Service — the single config file for the done-for-you
 * offering. Brand, site URL and contact email live here (no [Company name]
 * / [Website] / [Email] placeholders in copy); plan facts live here too so
 * marketing, the application form, and the dashboard all quote the same
 * numbers.
 */

export const FRONT_OFFICE = {
  /** Brand name shown in every customer-facing surface. */
  BRAND: "Switchboard",
  /** Canonical site URL (used in outbound links and emails). */
  SITE_URL: "https://tidy-pro.vercel.app",
  /**
   * Contact / notification email. Set CONTACT_EMAIL in the environment;
   * defaults to the owner's inbox.
   */
  CONTACT_EMAIL:
    process.env.CONTACT_EMAIL ?? "azizdemir6@gmail.com",
  /** Founding-client program: total spots. The UI shows this minus the
   *  approved application count — it is never hardcoded in a component. */
  FOUNDING_SPOTS_TOTAL: 50,
  /** Tagline used across marketing. */
  TAGLINE: "Every call answered. Every business.",
} as const;

export type FrontOfficePlanId = "front_desk" | "full_office";

export type FrontOfficePlan = {
  id: FrontOfficePlanId;
  name: string;
  price: number;
  blurb: string;
  /** Bullets shown in the plan card / comparison table. */
  features: string[];
};

export const FRONT_OFFICE_PLANS: Record<FrontOfficePlanId, FrontOfficePlan> = {
  front_desk: {
    id: "front_desk",
    name: "Essential",
    price: 299,
    blurb: "Every call, text and form answered — day or night.",
    features: [
      "Every call answered live by an AI assistant, day or night",
      "Texts, web forms and emails answered within minutes",
      "Quotes sent from your price list and followed up by text and email until the customer books or says no",
      "New appointments booked into your schedule, with confirmations and day-before reminders",
      "Monday report: enquiries, bookings, open quotes, money collected and overdue",
    ],
  },
  full_office: {
    id: "full_office",
    name: "Complete",
    price: 599,
    blurb: "Everything in Essential, plus invoicing and collections.",
    features: [
      "Everything in Front Desk",
      "Invoices sent after each visit; cards charged automatically; payment reminders by text and email until paid",
      "Reschedules, cancellations and review requests handled",
    ],
  },
};

export const FRONT_OFFICE_PLAN_IDS: FrontOfficePlanId[] = [
  "front_desk",
  "full_office",
];

/** Shared closing line for the offer: no per-call charges, free migration,
 *  nobody to hire. */
export const FRONT_OFFICE_NO_HIRE_LINE =
  "No per-call charges. We move your customers and schedule into our booking system for free. There is nobody to hire, train or manage.";
