/**
 * TidyPro platform plans — what the cleaning company itself pays us.
 * Separate from Stripe Connect, which the company uses to charge
 * ITS customers. Prices are informational; Stripe Price IDs live in
 * STRIPE_PRICE_BASIC / STRIPE_PRICE_STARTER / STRIPE_PRICE_GROWTH /
 * STRIPE_PRICE_PRO.
 */

export type PlanId = "basic" | "starter" | "growth" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  priceCents: number;
  /** null = unlimited */
  seats: number | null;
  blurb: string;
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  basic: {
    id: "basic",
    name: "Basic",
    priceCents: 1000,
    seats: 1,
    blurb: "For solo cleaners getting started.",
    features: [
      "1 user",
      "Up to 50 active customers",
      "Scheduling",
      "Quotes & bookings",
      "Invoicing with online payments",
      "Customer portal",
      "Email support",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceCents: 1500,
    seats: 3,
    blurb: "Perfect for small teams getting organized.",
    features: [
      "3 users",
      "Up to 100 active customers",
      "Scheduling",
      "Quotes & bookings",
      "Invoicing with online payments",
      "Customer portal",
      "Email support",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceCents: 3500,
    seats: 5,
    blurb: "Ideal for established businesses ready to scale.",
    features: [
      "Up to 5 users",
      "Unlimited customers",
      "Everything in Starter",
      "Automated quote follow-up",
      "Recurring bookings",
      "Crew scheduling & mobile checklists",
      "Automated reminders",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 4500,
    seats: null,
    blurb: "Our most comprehensive plan with full features and priority support.",
    features: [
      "Unlimited users",
      "Everything in Starter & Growth",
      "Business reports",
      "Before/after photo uploads",
      "Priority support",
    ],
  },
};

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

export function isPlanId(v: unknown): v is PlanId {
  return typeof v === "string" && v in PLANS;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

/** Subscription statuses that count as "in good standing". */
const GOOD_STATUSES = new Set(["trialing", "active"]);

export function subscriptionInGoodStanding(status: string | null | undefined): boolean {
  return GOOD_STATUSES.has(status ?? "");
}

/**
 * Seat check: members count includes the owner. Pending invites are not
 * counted here (they are blocked at invite time instead).
 */
export function seatsAvailable(plan: PlanId, memberCount: number): boolean {
  const limit = PLANS[plan].seats;
  return limit === null || memberCount < limit;
}

export function seatLimitLabel(plan: PlanId): string {
  const limit = PLANS[plan].seats;
  return limit === null ? "Unlimited" : `${limit} seat${limit === 1 ? "" : "s"}`;
}

/**
 * Feature gating by plan. Tiers are cumulative: Growth includes everything
 * in Starter, Pro includes everything in Growth.
 */
export type PlanFeature = "schedule" | "checklists" | "reports" | "photos";

const FEATURE_MIN_PLAN: Record<PlanFeature, PlanId> = {
  schedule: "growth", // Week schedule view
  checklists: "growth", // Job checklists & crew assignment
  reports: "pro", // Company reporting dashboard
  photos: "pro", // Before/after job photo uploads
};

const PLAN_RANK: Record<PlanId, number> = { basic: 0, starter: 1, growth: 2, pro: 3 };

export function hasFeature(plan: PlanId, feature: PlanFeature): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}

/** Human-readable plan name required for a feature (for upgrade prompts). */
export function requiredPlanFor(feature: PlanFeature): string {
  return PLANS[FEATURE_MIN_PLAN[feature]].name;
}
