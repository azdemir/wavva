"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/input";
import { createAddress } from "@/lib/actions/customers";

export function AddressForm({ customerId }: { customerId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        + Add address
      </Button>
    );
  }

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await createAddress(formData);
        setPending(false);
        if (result?.error) setError(result.error);
        else setOpen(false);
      }}
      className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
    >
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <input type="hidden" name="customer_id" value={customerId} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="addr-label" name="label" label="Label" defaultValue="Home" placeholder="Home" />
        <div className="sm:col-span-2">
          <Field id="addr-line1" name="address_line1" label="Street address" required placeholder="123 Main St" />
        </div>
      </div>
      <Field id="addr-line2" name="address_line2" label="Apt / unit (optional)" placeholder="Apt 4B" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="addr-city" name="city" label="City" required placeholder="Albany" />
        <Field id="addr-state" name="state" label="State" required placeholder="NY" />
        <Field id="addr-zip" name="zip" label="ZIP" required placeholder="12203" />
      </div>
      <TextareaField
        id="addr-access"
        name="access_instructions"
        label="Access instructions (sensitive — only shown to assigned staff)"
        rows={2}
        placeholder="Lockbox code, parking, alarm…"
      />
      <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" name="is_default" className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 dark:text-brand-400" />
        Default address for this customer
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save address"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
