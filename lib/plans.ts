/**
 * TidyPro platform plans — what the cleaning company itself pays us.
 * Separate from Stripe Connect, which the company uses to charge
 * ITS customers. Prices are informational; Stripe Price IDs live in
 * STRIPE_PRICE_STARTER / STRIPE_PRICE_GROWTH / STRIPE_PRICE_PRO.
 */

export type PlanId = "starter" | "growth" | "pro";

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
  starter: {
    id: "starter",
    name: "Starter",
    priceCents: 4900,
    seats: 1,
    blurb: "For solo cleaners getting organized.",
    features: [
      "1 user",
      "Up to 50 active customers",
      "Quotes & bookings",
      "Basic invoicing",
      "Email support",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceCents: 9900,
    seats: 5,
    blurb: "For growing teams winning more jobs.",
    features: [
      "Up to 5 users",
      "Unlimited customers",
      "Recurring bookings",
      "Customer portal",
      "Crew scheduling & conflict alerts",
      "Priority support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 19900,
    seats: null,
    blurb: "For established companies running crews.",
    features: [
      "Unlimited users",
      "Multi-crew scheduling",
      "Before/after photo uploads",
      "Business reports",
      "Dedicated onboarding",
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

const PLAN_RANK: Record<PlanId, number> = { starter: 0, growth: 1, pro: 2 };

export function hasFeature(plan: PlanId, feature: PlanFeature): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}

/** Human-readable plan name required for a feature (for upgrade prompts). */
export function requiredPlanFor(feature: PlanFeature): string {
  return PLANS[FEATURE_MIN_PLAN[feature]].name;
}
