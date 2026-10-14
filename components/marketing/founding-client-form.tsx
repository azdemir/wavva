"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextareaField } from "@/components/ui/input";
import { track } from "@/lib/analytics";
import { FRONT_OFFICE_PLANS, type FrontOfficePlanId } from "@/lib/front-office";

type Status = "idle" | "submitting" | "done";

/**
 * Founding-client application form. Posts to /api/founding-client, shows a
 * confirmation on success, and fires an application_submit analytics event.
 * The plan can be pre-selected via ?plan=front_desk|full_office.
 */
export function FoundingClientForm() {
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan");
  const [plan, setPlan] = useState<FrontOfficePlanId>(
    initialPlan === "full_office" ? "full_office" : "front_desk",
  );
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  if (status === "done") {
    return (
      <div
        role="status"
        className="rounded-xl border border-green-200 bg-green-50 px-6 py-10 text-center dark:border-green-900 dark:bg-green-950"
      >
        <p className="text-xl font-bold text-green-800 dark:text-green-200">
          Application received!
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-green-700 dark:text-green-300">
          Thanks — we&apos;ll review your application and reach out within two
          business days. If you&apos;re one of the five founding clients,
          setup is free and your price is locked for 12 months.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus("submitting");
        setError(null);
        const fd = new FormData(e.currentTarget);
        const payload = {
          company_name: String(fd.get("company_name") ?? ""),
          owner_name: String(fd.get("owner_name") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          email: String(fd.get("email") ?? ""),
          city: String(fd.get("city") ?? ""),
          crew_count: Number(fd.get("crew_count") ?? 0),
          current_tools: String(fd.get("current_tools") ?? ""),
          plan_interest: plan,
        };
        try {
          const res = await fetch("/api/founding-client", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = (await res.json()) as { ok?: boolean; error?: string };
          if (!res.ok || !data.ok) {
            setError(data.error ?? "Something went wrong. Please try again.");
            setStatus("idle");
            return;
          }
          track("application_submit", { plan });
          setStatus("done");
        } catch {
          setError("Something went wrong. Please try again.");
          setStatus("idle");
        }
      }}
    >
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="fc-company"
          name="company_name"
          label="Company name"
          type="text"
          autoComplete="organization"
          placeholder="Capital Region Clean Co."
          required
        />
        <Field
          id="fc-owner"
          name="owner_name"
          label="Owner name"
          type="text"
          autoComplete="name"
          placeholder="Jordan Smith"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="fc-phone"
          name="phone"
          label="Phone"
          type="tel"
          autoComplete="tel"
          placeholder="(518) 555-0100"
          required
        />
        <Field
          id="fc-email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="fc-city"
          name="city"
          label="City"
          type="text"
          autoComplete="address-level2"
          placeholder="Albany"
          required
          hint="We're onboarding founding clients in Upstate New York."
        />
        <Field
          id="fc-crews"
          name="crew_count"
          label="Number of crews"
          type="number"
          min={0}
          max={500}
          defaultValue={1}
          required
        />
      </div>
      <SelectField
        id="fc-plan"
        label="Plan interest"
        value={plan}
        onChange={(e) => setPlan(e.target.value as FrontOfficePlanId)}
        required
      >
        <option value="front_desk">
          Front Desk — ${FRONT_OFFICE_PLANS.front_desk.price}/month
        </option>
        <option value="full_office">
          Full Office — ${FRONT_OFFICE_PLANS.full_office.price}/month
        </option>
      </SelectField>
      <TextareaField
        id="fc-tools"
        name="current_tools"
        label="What tools do you use today?"
        hint="e.g. spreadsheets, Jobber, paper schedule — anything. Optional."
        placeholder="Spreadsheets and texting…"
        rows={3}
      />
      <Button type="submit" className="w-full" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Apply as a founding client"}
      </Button>
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Month to month. Free setup for founding clients. No spam, ever.
      </p>
    </form>
  );
}
