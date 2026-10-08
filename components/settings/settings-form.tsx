"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/input";
import { updateCompanySettings } from "@/lib/actions/settings";
import type { Company } from "@/lib/auth";

const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

export function SettingsForm({ company }: { company: Company }) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  const settings = company.settings as {
    default_tax_rate?: number;
    cancellation_policy?: string | null;
    frequency_multipliers?: { weekly?: number; biweekly?: number; monthly?: number };
  };

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError(null);
        setSaved(false);
        const result = await updateCompanySettings(formData);
        setPending(false);
        if (result?.error) setError(result.error);
        else setSaved(true);
      }}
      className="space-y-8"
    >
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {saved && (
        <div role="status" className="rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800">
          Settings saved.
        </div>
      )}

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Company profile</h3>
        <Field id="set-name" name="name" label="Business name" defaultValue={company.name} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="set-phone" name="phone" label="Phone" type="tel" defaultValue={company.phone ?? ""} />
          <Field id="set-email" name="email" label="Email" type="email" defaultValue={company.email ?? ""} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="set-website" name="website" label="Website" defaultValue={company.website ?? ""} />
          <div>
            <label htmlFor="set-timezone" className="block text-sm font-medium text-slate-700">
              Time zone
            </label>
            <select
              id="set-timezone"
              name="timezone"
              defaultValue={company.timezone}
              className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Pricing & policies</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="set-tax"
            name="default_tax_rate"
            label="Default tax rate (e.g. 0.08 for 8%)"
            type="number"
            min="0"
            max="1"
            step="0.0001"
            defaultValue={settings.default_tax_rate ?? 0}
          />
        </div>
        <TextareaField
          id="set-cancel"
          name="cancellation_policy"
          label="Cancellation policy"
          rows={3}
          placeholder="Cancellations made less than 24 hours before the visit are billed at 50%."
          defaultValue={settings.cancellation_policy ?? ""}
        />
        <div>
          <p className="text-sm font-medium text-slate-700">Recurring-visit price multipliers</p>
          <p className="text-xs text-slate-500">1 = full price, 0.95 = 5% off. Applied when quoting recurring work.</p>
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            <Field
              id="set-weekly"
              name="freq_weekly"
              label="Weekly"
              type="number" min="0" max="2" step="0.01"
              defaultValue={settings.frequency_multipliers?.weekly ?? 1}
            />
            <Field
              id="set-biweekly"
              name="freq_biweekly"
              label="Every 2 weeks"
              type="number" min="0" max="2" step="0.01"
              defaultValue={settings.frequency_multipliers?.biweekly ?? 1}
            />
            <Field
              id="set-monthly"
              name="freq_monthly"
              label="Monthly"
              type="number" min="0" max="2" step="0.01"
              defaultValue={settings.frequency_multipliers?.monthly ?? 1}
            />
          </div>
        </div>
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
