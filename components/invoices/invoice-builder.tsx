"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/input";
import { formatCents } from "@/lib/format";
import { computeTotals } from "@/lib/pricing";
import { createInvoice } from "@/lib/actions/invoices";

type Item = { label: string; qty: string; unit_price: string };
const emptyItem = (): Item => ({ label: "", qty: "1", unit_price: "" });

export function InvoiceBuilder({
  customers,
  defaultTaxRate,
  prefill,
}: {
  customers: { id: string; name: string }[];
  defaultTaxRate: number;
  prefill?: { customerId?: string; bookingId?: string; notes?: string };
}) {
  const [customerId, setCustomerId] = useState(prefill?.customerId ?? customers[0]?.id ?? "");
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [taxRate, setTaxRate] = useState(String(defaultTaxRate));
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState(prefill?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set = (i: number, patch: Partial<Item>) =>
    setItems((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const totals = useMemo(() => {
    const priced = items.map((it) => ({
      qty: Number(it.qty) || 0,
      unit_price_cents: Math.round(Number(it.unit_price || 0) * 100),
    }));
    return computeTotals(priced, 0, Number(taxRate || 0));
  }, [items, taxRate]);

  async function submit() {
    setPending(true);
    setError(null);
    const result = await createInvoice({
      customer_id: customerId,
      booking_id: prefill?.bookingId || "",
      due_date: dueDate || "",
      notes,
      tax_rate: Number(taxRate || 0),
      items: items.map((it) => ({
        label: it.label.trim(),
        qty: Number(it.qty) || 1,
        unit_price_cents: Math.round(Number(it.unit_price || 0) * 100),
      })),
    });
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="max-w-md">
        <label htmlFor="inv-customer" className="block text-sm font-medium text-slate-700">Customer</label>
        <select
          id="inv-customer"
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
          <div key={i} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1fr_90px_130px_auto]">
            <Field id={`inv-label-${i}`} label={i === 0 ? "Description" : ""} value={it.label} onChange={(e) => set(i, { label: e.target.value })} placeholder="Standard home cleaning — Oct 12" />
            <Field id={`inv-qty-${i}`} label={i === 0 ? "Qty" : ""} type="number" min="0" step="0.01" value={it.qty} onChange={(e) => set(i, { qty: e.target.value })} />
            <Field id={`inv-price-${i}`} label={i === 0 ? "Unit price ($)" : ""} type="number" min="0" step="0.01" value={it.unit_price} onChange={(e) => set(i, { unit_price: e.target.value })} />
            {items.length > 1 && (
              <button type="button" onClick={() => setItems((rs) => rs.filter((_, j) => j !== i))} className="text-sm font-medium text-red-600 hover:text-red-700 self-end pb-3">
                Remove
              </button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setItems((rs) => [...rs, emptyItem()])}>
          + Add line item
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="inv-tax" label="Tax rate (e.g. 0.08)" type="number" min="0" max="1" step="0.0001" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
        <Field id="inv-due" label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>

      <TextareaField id="inv-notes" label="Notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment terms…" />

      <div className="rounded-xl bg-slate-100 p-4 text-sm">
        <div className="flex justify-between py-1"><span className="text-slate-600">Subtotal</span><span className="font-medium">{formatCents(totals.subtotal)}</span></div>
        <div className="flex justify-between py-1"><span className="text-slate-600">Tax</span><span className="font-medium">{formatCents(totals.tax)}</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900"><span>Total</span><span>{formatCents(totals.total)}</span></div>
      </div>

      <Button onClick={submit} disabled={pending || !customerId} className="w-full sm:w-auto">
        {pending ? "Creating…" : "Create invoice"}
      </Button>
    </div>
  );
}
