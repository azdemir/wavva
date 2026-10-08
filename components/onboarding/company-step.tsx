"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { saveCompanyProfile } from "@/lib/actions/onboarding";
import type { Company } from "@/lib/auth";

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
      <Field
        id="ob-website"
        name="website"
        label="Website (optional)"
        placeholder="www.company.com"
        defaultValue={company?.website ?? ""}
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
