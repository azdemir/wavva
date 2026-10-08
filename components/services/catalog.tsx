"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, SelectField } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/format";
import {
  createService,
  updateService,
  setServiceActive,
  deleteService,
  createAddon,
  updateAddon,
  setAddonActive,
  deleteAddon,
  type ActionResult,
} from "@/lib/actions/services";

export type ServiceRow = {
  id: string;
  name: string;
  category: "residential" | "commercial";
  description: string | null;
  base_price_cents: number;
  unit: "per_visit" | "per_hour" | "per_sqft";
  is_active: boolean;
};

export type AddonRow = {
  id: string;
  name: string;
  price_cents: number;
  is_active: boolean;
};

const unitLabels = { per_visit: "per visit", per_hour: "per hour", per_sqft: "per sq ft" } as const;

function useFeedback() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function run(fn: () => Promise<ActionResult>) {
    setPending(true);
    setError(null);
    const r = await fn();
    setPending(false);
    if (r?.error) setError(r.error);
    return !r?.error;
  }
  return { error, pending, run };
}

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

export function ServiceManager({ initial }: { initial: ServiceRow[] }) {
  const { error, pending, run } = useFeedback();
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <ErrorNote message={error} />
      <ul className="divide-y divide-slate-100">
        {initial.map((s) => (
          <li key={s.id} className="py-4">
            {editing === s.id ? (
              <form
                action={(fd) => {
                  void (async () => {
                    const ok = await run(() => updateService(s.id, fd));
                    if (ok) setEditing(null);
                  })();
                }}
                className="space-y-3 rounded-xl border border-slate-200 p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id={`se-name-${s.id}`} name="name" label="Name" required defaultValue={s.name} />
                  <SelectField id={`se-cat-${s.id}`} name="category" label="Type" defaultValue={s.category}>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                  </SelectField>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id={`se-price-${s.id}`} name="price" label="Base price ($)" type="number" min="0" step="0.01" required defaultValue={(s.base_price_cents / 100).toFixed(2)} />
                  <SelectField id={`se-unit-${s.id}`} name="unit" label="Priced" defaultValue={s.unit}>
                    {(Object.keys(unitLabels) as (keyof typeof unitLabels)[]).map((u) => (
                      <option key={u} value={u}>{unitLabels[u]}</option>
                    ))}
                  </SelectField>
                </div>
                <Field id={`se-desc-${s.id}`} name="description" label="Description" defaultValue={s.description ?? ""} />
                <div className="flex gap-2">
                  <Button type="submit" disabled={pending}>Save</Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">
                    {s.name}{" "}
                    <Badge tone={s.category === "residential" ? "brand" : "accent"}>{s.category}</Badge>{" "}
                    {!s.is_active && <Badge tone="slate">inactive</Badge>}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatCents(s.base_price_cents)} {unitLabels[s.unit]}
                    {s.description ? ` · ${s.description}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => run(() => setServiceActive(s.id, !s.is_active))} disabled={pending}>
                    {s.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditing(s.id)}>Edit</Button>
                  <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => { if (confirm(`Delete "${s.name}"?`)) run(() => deleteService(s.id)); }} disabled={pending}>
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <form action={(fd) => { void run(() => createService(fd)); }} className="space-y-3 rounded-xl border border-dashed border-slate-300 p-4">
        <p className="text-sm font-semibold text-slate-700">Add a service</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="ns-name" name="name" label="Name" required placeholder="Standard home cleaning" />
          <SelectField id="ns-cat" name="category" label="Type">
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </SelectField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="ns-price" name="price" label="Base price ($)" type="number" min="0" step="0.01" required placeholder="129.00" />
          <SelectField id="ns-unit" name="unit" label="Priced">
            <option value="per_visit">per visit</option>
            <option value="per_hour">per hour</option>
            <option value="per_sqft">per sq ft</option>
          </SelectField>
        </div>
        <Button type="submit" disabled={pending}>Add service</Button>
      </form>
    </div>
  );
}

export function AddonManager({ initial }: { initial: AddonRow[] }) {
  const { error, pending, run } = useFeedback();
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <ErrorNote message={error} />
      <ul className="divide-y divide-slate-100">
        {initial.map((a) => (
          <li key={a.id} className="py-3">
            {editing === a.id ? (
              <form
                action={(fd) => {
                  void (async () => {
                    const ok = await run(() => updateAddon(a.id, fd));
                    if (ok) setEditing(null);
                  })();
                }}
                className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 p-4"
              >
                <div className="min-w-40 flex-1">
                  <Field id={`ae-name-${a.id}`} name="name" label="Name" required defaultValue={a.name} />
                </div>
                <div className="w-36">
                  <Field id={`ae-price-${a.id}`} name="price" label="Price ($)" type="number" min="0" step="0.01" required defaultValue={(a.price_cents / 100).toFixed(2)} />
                </div>
                <Button type="submit" disabled={pending}>Save</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              </form>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <p className="min-w-0 flex-1 font-medium text-slate-900">
                  {a.name}{" "}
                  <span className="text-sm font-normal text-slate-500">{formatCents(a.price_cents)}</span>{" "}
                  {!a.is_active && <Badge tone="slate">inactive</Badge>}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => run(() => setAddonActive(a.id, !a.is_active))} disabled={pending}>
                    {a.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditing(a.id)}>Edit</Button>
                  <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => { if (confirm(`Delete "${a.name}"?`)) run(() => deleteAddon(a.id)); }} disabled={pending}>
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <form action={(fd) => { void run(() => createAddon(fd)); }} className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-slate-300 p-4">
        <div className="min-w-40 flex-1">
          <Field id="na-name" name="name" label="Add-on name" required placeholder="Inside fridge" />
        </div>
        <div className="w-36">
          <Field id="na-price" name="price" label="Price ($)" type="number" min="0" step="0.01" required placeholder="25.00" />
        </div>
        <Button type="submit" disabled={pending}>Add add-on</Button>
      </form>
      <p className="text-xs text-slate-500">
        Recurring-visit discounts (weekly / biweekly / monthly) live in Settings.
      </p>
    </div>
  );
}
