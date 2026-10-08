"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/input";
import type { ActionResult } from "@/lib/actions/customers";

export type CustomerFields = {
  name: string;
  email: string;
  phone: string;
  notes: string;
  sms_consent: boolean;
};

export function CustomerForm({
  initial,
  action,
  submitLabel,
}: {
  initial?: Partial<CustomerFields>;
  action: (formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await action(formData);
        setPending(false);
        if (result?.error) setError(result.error);
      }}
      className="space-y-4"
    >
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Field
        id="cust-name"
        name="name"
        label="Full name"
        required
        defaultValue={initial?.name ?? ""}
        placeholder="Jane Smith"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="cust-email"
          name="email"
          label="Email"
          type="email"
          defaultValue={initial?.email ?? ""}
          placeholder="jane@example.com"
        />
        <Field
          id="cust-phone"
          name="phone"
          label="Phone"
          type="tel"
          defaultValue={initial?.phone ?? ""}
          placeholder="(518) 555-0100"
        />
      </div>
      <TextareaField
        id="cust-notes"
        name="notes"
        label="Notes"
        rows={3}
        defaultValue={initial?.notes ?? ""}
        placeholder="Gate code, pets, preferences…"
      />
      <label className="flex items-start gap-2.5 text-sm text-slate-700">
        <input
          type="checkbox"
          name="sms_consent"
          defaultChecked={initial?.sms_consent ?? false}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600"
        />
        <span>
          This customer consented to SMS reminders and notifications.
        </span>
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
