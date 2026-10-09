"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createPlanCheckout, createBillingPortalSession } from "@/lib/actions/platform-billing";
import type { PlanId } from "@/lib/plans";

/** Plan card CTA: starts Stripe Checkout, shows errors inline. */
export function PlanButton({
  planId,
  label,
  outline,
}: {
  planId: PlanId;
  label: string;
  outline?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="mt-5">
      {error && (
        <p role="alert" className="mb-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <Button
        type="button"
        className="w-full"
        variant={outline ? "outline" : "primary"}
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          // On success this redirects to Stripe, so we never reset pending.
          const result = await createPlanCheckout(planId);
          if (result?.error) {
            setError(result.error);
            setPending(false);
          }
        }}
      >
        <span className="whitespace-normal text-center leading-snug">
          {pending ? "Starting checkout…" : label}
        </span>
      </Button>
    </div>
  );
}

/** "Manage subscription" — opens the Stripe customer portal. */
export function ManageSubscriptionButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div>
      {error && (
        <p role="alert" className="mb-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await createBillingPortalSession();
          if (result?.error) {
            setError(result.error);
            setPending(false);
          }
        }}
      >
        {pending ? "Opening…" : "Manage subscription"}
      </Button>
    </div>
  );
}
