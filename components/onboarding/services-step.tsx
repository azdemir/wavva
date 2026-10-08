"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { saveServices } from "@/lib/actions/onboarding";

type Row = {
  name: string;
  category: "residential" | "commercial";
  description: string;
  price: string;
  unit: "per_visit" | "per_hour" | "per_sqft";
};

const emptyRow = (): Row => ({
  name: "",
  category: "residential",
  description: "",
  price: "",
  unit: "per_visit",
});

const unitLabels = {
  per_visit: "per visit",
  per_hour: "per hour",
  per_sqft: "per sq ft",
} as const;

export function ServicesStep({ initial }: { initial?: Row[] }) {
  const [rows, setRows] = useState<Row[]>(
    initial && initial.length > 0 ? initial : [emptyRow()],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function submit() {
    setPending(true);
    setError(null);
    const payload = rows.map((r) => ({
      name: r.name.trim(),
      category: r.category,
      description: r.description.trim(),
      base_price_cents: Math.round(Number(r.price || 0) * 100),
      unit: r.unit,
    }));
    const result = await saveServices(payload);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Add the cleaning services you sell. You can change these anytime later.
      </p>
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {rows.map((r, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Service {i + 1}
            </span>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
          <Field
            id={`svc-name-${i}`}
            label="Service name"
            value={r.name}
            onChange={(e) => set(i, { name: e.target.value })}
            placeholder="Standard home cleaning"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor={`svc-cat-${i}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Type
              </label>
              <select
                id={`svc-cat-${i}`}
                value={r.category}
                onChange={(e) => set(i, { category: e.target.value as Row["category"] })}
                className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white px-3 text-sm"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <Field
              id={`svc-price-${i}`}
              label="Base price ($)"
              type="number"
              min="0"
              step="0.01"
              value={r.price}
              onChange={(e) => set(i, { price: e.target.value })}
              placeholder="129.00"
            />
            <div>
              <label htmlFor={`svc-unit-${i}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Priced
              </label>
              <select
                id={`svc-unit-${i}`}
                value={r.unit}
                onChange={(e) => set(i, { unit: e.target.value as Row["unit"] })}
                className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white px-3 text-sm"
              >
                {(Object.keys(unitLabels) as (keyof typeof unitLabels)[]).map((u) => (
                  <option key={u} value={u}>
                    {unitLabels[u]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => setRows((rs) => [...rs, emptyRow()])}
      >
        + Add another service
      </Button>
      <Button onClick={submit} className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Continue"}
      </Button>
    </div>
  );
}
