import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Server-side Stripe client. Returns null when STRIPE_SECRET_KEY is not set —
 * every caller must handle the unconfigured case with a clear message.
 * Never import this in client components.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) {
    cached = new Stripe(key);
  }
  return cached;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
