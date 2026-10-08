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
    seats: 3,
    blurb: "For solo cleaners getting organized.",
    features: ["Up to 3 team seats", "Quotes & bookings", "Invoices & customer portal", "Email notifications"],
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceCents: 9900,
    seats: 10,
    blurb: "For growing crews that need scheduling muscle.",
    features: [
      "Up to 10 team seats",
      "Everything in Starter",
      "Week schedule view",
      "Job checklists & crew assignment",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 19900,
    seats: null,
    blurb: "For established companies running multiple crews.",
    features: [
      "Unlimited team seats",
      "Everything in Growth",
      "Platform admin reporting",
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
  return limit === null ? "Unlimited" : `${limit} seats`;
}
