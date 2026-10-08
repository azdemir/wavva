"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { saveCompanyProfile } from "@/lib/actions/onboarding";
import type { Company } from "@/lib/auth";

const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

export function CompanyStep({ company }: { company?: Company | null }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await saveCompanyProfile(formData);
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
        id="ob-name"
        name="name"
        label="Business name"
        placeholder="Capital Region Clean Co."
        defaultValue={company?.name ?? ""}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="ob-phone"
          name="phone"
          label="Business phone"
          type="tel"
          placeholder="(518) 555-0100"
          defaultValue={company?.phone ?? ""}
        />
        <Field
          id="ob-email"
          name="email"
          label="Business email"
          type="email"
          placeholder="hello@company.com"
          defaultValue={company?.email ?? ""}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="ob-website"
          name="website"
          label="Website (optional)"
          placeholder="www.company.com"
          defaultValue={company?.website ?? ""}
        />
        <div>
          <label htmlFor="ob-timezone" className="block text-sm font-medium text-slate-700">
            Time zone
          </label>
          <select
            id="ob-timezone"
            name="timezone"
            defaultValue={company?.timezone ?? "America/New_York"}
            className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:outline-2 focus:outline-offset-1 focus:outline-brand-600"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
