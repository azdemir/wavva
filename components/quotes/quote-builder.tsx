"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/input";
import { formatCents } from "@/lib/format";
import { computeTotals } from "@/lib/pricing";
import { createQuote } from "@/lib/actions/quotes";

export type BuilderService = { id: string; name: string; base_price_cents: number };
export type BuilderAddon = { id: string; name: string; price_cents: number };
export type BuilderCustomer = { id: string; name: string };

type Item = {
  kind: "service" | "addon" | "custom";
  ref_id: string;
  label: string;
  qty: string;
  unit_price_cents: string; // dollars as string for the input
};

const emptyItem = (): Item => ({
  kind: "custom",
  ref_id: "",
  label: "",
  qty: "1",
  unit_price_cents: "",
});

export function QuoteBuilder({
  customers,
  services,
  addons,
  defaultTaxRate,
}: {
  customers: BuilderCustomer[];
  services: BuilderService[];
  addons: BuilderAddon[];
  defaultTaxRate: number;
}) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [discount, setDiscount] = useState("");
  const [taxRate, setTaxRate] = useState(String(defaultTaxRate));
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set = (i: number, patch: Partial<Item>) =>
    setItems((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  function pickService(i: number, serviceId: string) {
    if (!serviceId) {
      set(i, { kind: "custom", ref_id: "", label: "", unit_price_cents: "" });
      return;
    }
    const s = services.find((x) => x.id === serviceId);
    if (s) set(i, { kind: "service", ref_id: s.id, label: s.name, unit_price_cents: (s.base_price_cents / 100).toFixed(2) });
  }

  function pickAddon(i: number, addonId: string) {
    const a = addons.find((x) => x.id === addonId);
    if (a) set(i, { kind: "addon", ref_id: a.id, label: a.name, unit_price_cents: (a.price_cents / 100).toFixed(2) });
  }

  const totals = useMemo(() => {
    const priced = items.map((it) => ({
      qty: Number(it.qty) || 0,
      unit_price_cents: Math.round(Number(it.unit_price_cents || 0) * 100),
    }));
    return computeTotals(priced, Math.round(Number(discount || 0) * 100), Number(taxRate || 0));
  }, [items, discount, taxRate]);

  async function submit() {
    setPending(true);
    setError(null);
    const result = await createQuote({
      customer_id: customerId,
      valid_until: validUntil || "",
      notes,
      discount_cents: Math.round(Number(discount || 0) * 100),
      tax_rate: Number(taxRate || 0),
      items: items.map((it) => ({
        kind: it.kind,
        ref_id: it.ref_id || "",
        label: it.label.trim(),
        qty: Number(it.qty) || 1,
        unit_price_cents: Math.round(Number(it.unit_price_cents || 0) * 100),
      })),
    });
    setPending(false);
    if (result?.error) setError(result.error);
    // Success redirects to the quote detail page.
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="max-w-md">
        <label htmlFor="qb-customer" className="block text-sm font-medium text-slate-700">
          Customer
        </label>
        <select
          id="qb-customer"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Line items</h3>
        {items.map((it, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Item {i + 1}</span>
              {items.length > 1 && (
                <button type="button" onClick={() => setItems((rs) => rs.filter((_, j) => j !== i))} className="text-sm font-medium text-red-600 hover:text-red-700">
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={`qb-svc-${i}`} className="block text-sm font-medium text-slate-700">From service</label>
                <select
                  id={`qb-svc-${i}`}
                  value={it.kind === "service" ? it.ref_id : ""}
                  onChange={(e) => pickService(i, e.target.value)}
                  className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="">Custom line…</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {formatCents(s.base_price_cents)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`qb-addon-${i}`} className="block text-sm font-medium text-slate-700">Or add-on</label>
                <select
                  id={`qb-addon-${i}`}
                  value={it.kind === "addon" ? it.ref_id : ""}
                  onChange={(e) => pickAddon(i, e.target.value)}
                  className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="">—</option>
                  {addons.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} — {formatCents(a.price_cents)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <Field id={`qb-label-${i}`} label="Description" value={it.label} onChange={(e) => set(i, { label: e.target.value, kind: it.kind === "custom" ? "custom" : it.kind })} placeholder="What is this for?" />
              </div>
              <Field id={`qb-qty-${i}`} label="Qty" type="number" min="0" step="0.01" value={it.qty} onChange={(e) => set(i, { qty: e.target.value })} />
              <Field id={`qb-price-${i}`} label="Unit price ($)" type="number" min="0" step="0.01" value={it.unit_price_cents} onChange={(e) => set(i, { unit_price_cents: e.target.value })} />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setItems((rs) => [...rs, emptyItem()])}>
          + Add line item
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="qb-discount" label="Discount ($)" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" />
        <Field id="qb-tax" label="Tax rate (e.g. 0.08)" type="number" min="0" max="1" step="0.0001" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
        <Field id="qb-valid" label="Valid until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
      </div>

      <TextareaField id="qb-notes" label="Notes for the customer" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What's included, arrival window…" />

      <div className="rounded-xl bg-slate-100 p-4 text-sm">
        <div className="flex justify-between py-1"><span className="text-slate-600">Subtotal</span><span className="font-medium">{formatCents(totals.subtotal)}</span></div>
        <div className="flex justify-between py-1"><span className="text-slate-600">Discount</span><span className="font-medium">−{formatCents(totals.discount)}</span></div>
        <div className="flex justify-between py-1"><span className="text-slate-600">Tax</span><span className="font-medium">{formatCents(totals.tax)}</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900"><span>Total</span><span>{formatCents(totals.total)}</span></div>
      </div>

      <Button onClick={submit} disabled={pending || !customerId} className="w-full sm:w-auto">
        {pending ? "Creating…" : "Create quote"}
      </Button>
    </div>
  );
}
