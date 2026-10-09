"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { captureTrialLead } from "@/lib/studio/actions";

/**
 * Trial-request form. Submissions become CRM leads (source=trial) in Studio
 * and notify the owner — the "Start free trial" CTA finally does something.
 */
export function TrialForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-lg border border-green-200 bg-green-50 px-4 py-6 text-center dark:border-green-900 dark:bg-green-950"
      >
        <p className="text-base font-semibold text-green-800 dark:text-green-200">
          Request received!
        </p>
        <p className="mt-1 text-sm text-green-700 dark:text-green-300">
          Thanks — we&apos;ll reach out shortly to get your trial set up.
        </p>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError(null);
        try {
          const result = await captureTrialLead(formData);
          if (result?.error) setError(result.error);
          else setSent(true);
        } finally {
          setPending(false);
        }
      }}
      className="space-y-4"
    >
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </div>
      )}
      <Field
        id="demo-name"
        name="name"
        label="Your name"
        type="text"
        autoComplete="name"
        placeholder="Jordan Smith"
        required
      />
      <Field
        id="demo-company"
        name="company"
        label="Company name"
        type="text"
        autoComplete="organization"
        placeholder="Capital Region Clean Co."
        required
      />
      <Field
        id="demo-email"
        name="email"
        label="Work email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        required
      />
      <Field
        id="demo-phone"
        name="phone"
        label="Phone (optional)"
        type="tel"
        autoComplete="tel"
        placeholder="(518) 555-0100"
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Requesting…" : "Request my trial"}
      </Button>
    </form>
  );
}
