/**
 * Wavva platform plans — what the business itself pays us.
 * Separate from Stripe Connect, which the business uses to charge
 * ITS customers. Prices are informational; Stripe Price IDs live in
 * STRIPE_PRICE_ESSENTIAL / STRIPE_PRICE_COMPLETE.
 *
 * Plans are minutes-based (AI-answered call minutes), not seat-based,
 * so both tiers allow unlimited team seats.
 */

export type PlanId = "essential" | "complete";

export type Plan = {
  id: PlanId;
  name: string;
  priceCents: number;
  /** null = unlimited */
  seats: number | null;
  blurb: string;
  features: string[];
  /** AI-answered call minutes included per month. */
  minutesIncluded: number;
  /** Overage per AI-answered minute, in cents, after included minutes. */
  overagePerMinuteCents: number;
};

export const PLANS: Record<PlanId, Plan> = {
  essential: {
    id: "essential",
    name: "Essential",
    priceCents: 29900,
    seats: null,
    blurb: "Every call, text and form answered — day or night.",
    features: [
      "250 AI-answered call minutes included every month",
      "Every call answered live by an AI assistant, day or night",
      "Texts, web forms and emails answered within minutes",
      "Quotes sent from your price list and followed up until the customer books or says no",
      "New appointments booked into your schedule, with confirmations and day-before reminders",
      "Monday report: enquiries, bookings, open quotes, money collected and overdue",
    ],
    minutesIncluded: 250,
    overagePerMinuteCents: 30,
  },
  complete: {
    id: "complete",
    name: "Complete",
    priceCents: 59900,
    seats: null,
    blurb: "Everything in Essential, plus invoicing and collections.",
    features: [
      "600 AI-answered call minutes included every month",
      "Everything in Essential",
      "Invoices sent after each visit; cards charged automatically",
      "Payment reminders by text and email until paid",
      "Reschedules, cancellations and review requests handled",
    ],
    minutesIncluded: 600,
    overagePerMinuteCents: 30,
  },
};

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

/** Legacy TidyPro plan ids → Wavva plan ids (for the 0021 migration). */
const LEGACY_PLAN_MAP: Record<string, PlanId> = {
  basic: "essential",
  starter: "essential",
  growth: "complete",
  pro: "complete",
};

/** Map a legacy TidyPro plan id to its Wavva equivalent, if any. */
export function legacyPlanToNew(v: unknown): PlanId | null {
  if (typeof v !== "string") return null;
  return LEGACY_PLAN_MAP[v] ?? null;
}

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
 * Both Wavva tiers allow unlimited seats.
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
 * Feature gating by plan. Tiers are cumulative: Complete includes everything
 * in Essential.
 */
export type PlanFeature =
  | "schedule"
  | "checklists"
  | "reports"
  | "photos"
  | "communications"
  | "integrations"
  | "quickbooks";

const FEATURE_MIN_PLAN: Record<PlanFeature, PlanId> = {
  schedule: "essential",
  checklists: "essential",
  communications: "essential", // Automated SMS & email templates (core to Wavva)
  reports: "complete",
  photos: "complete", // Before/after job photo uploads
  integrations: "complete", // Mailchimp & Zapier integrations
  quickbooks: "complete", // QuickBooks Online accounting sync
};

const PLAN_RANK: Record<PlanId, number> = { essential: 0, complete: 1 };

/**
 * Accounts with access to every tier's features, regardless of the
 * company's plan. The founder's account is hardcoded so the grant survives
 * env changes; platform admins (PLATFORM_ADMIN_EMAILS) are included too.
 */
const ALL_ACCESS_EMAILS = ["azizdemir6@gmail.com"];

export function hasAllAccess(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  if (ALL_ACCESS_EMAILS.includes(normalized)) return true;
  const allowlist = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(normalized);
}

export function hasFeature(plan: PlanId, feature: PlanFeature): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}

/** Human-readable plan name required for a feature (for upgrade prompts). */
export function requiredPlanFor(feature: PlanFeature): string {
  return PLANS[FEATURE_MIN_PLAN[feature]].name;
}
