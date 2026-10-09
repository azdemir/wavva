"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/input";
import type { ActionResult } from "@/lib/actions/customers";

export type CustomerFields = {
  name: string;
  customer_type: "residential" | "commercial";
  email: string;
  phone: string;
  notes: string;
  sms_consent: boolean;
};

const customerTypes = [
  { value: "residential", label: "Residential", hint: "A home / household" },
  { value: "commercial", label: "Commercial", hint: "A business / office" },
] as const;

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
  const [type, setType] = useState<"residential" | "commercial">(
    initial?.customer_type ?? "residential",
  );

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
      <div>
        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Customer type
        </span>
        <div className="mt-1.5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Customer type">
          {customerTypes.map((t) => (
            <label
              key={t.value}
              className={`cursor-pointer rounded-lg border px-4 py-3 text-sm transition-colors ${
                type === t.value
                  ? "border-brand-600 bg-brand-50 dark:border-brand-500 dark:bg-brand-950"
                  : "border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              }`}
            >
              <input
                type="radio"
                name="customer_type"
                value={t.value}
                checked={type === t.value}
                onChange={() => setType(t.value)}
                className="sr-only"
              />
              <span className={`block font-semibold ${type === t.value ? "text-brand-700 dark:text-brand-300" : "text-slate-700 dark:text-slate-200"}`}>
                {t.label}
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{t.hint}</span>
            </label>
          ))}
        </div>
      </div>
      <Field
        id="cust-name"
        name="name"
        label={type === "commercial" ? "Business name" : "Full name"}
        required
        defaultValue={initial?.name ?? ""}
        placeholder={type === "commercial" ? "Acme Corp" : "Jane Smith"}
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
      <label className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          name="sms_consent"
          defaultChecked={initial?.sms_consent ?? false}
          className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 dark:text-brand-400"
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
