import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { setInvoiceStatus, recordPayment, deleteInvoice } from "@/lib/actions/invoices";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/input";
import { formatCents, formatDate } from "@/lib/format";

export const instant = false;

const tones = { draft: "slate", sent: "brand", overdue: "red", paid: "accent", void: "slate" } as const;

const nextActions: Record<string, { status: string; label: string }[]> = {
  draft: [{ status: "sent", label: "Mark as sent" }, { status: "void", label: "Void" }],
  sent: [{ status: "paid", label: "Mark paid" }, { status: "overdue", label: "Mark overdue" }, { status: "void", label: "Void" }],
  overdue: [{ status: "paid", label: "Mark paid" }, { status: "void", label: "Void" }],
  paid: [],
  void: [],
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requireCompany();
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, customers(id, name, email, phone), bookings(booking_number)")
    .eq("id", id)
    .eq("company_id", company.id)
    .single();
  if (!invoice) notFound();

  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase.from("invoice_line_items").select("*").eq("invoice_id", id).order("sort"),
    supabase.from("payments").select("*").eq("invoice_id", id).order("created_at", { ascending: false }),
  ]);

  const customer = one(invoice.customers);
  const due = invoice.total_cents - invoice.amount_paid_cents;

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Heading
          title={`Invoice ${invoice.invoice_number}`}
          description={`${customer?.name ?? "Customer"} · created ${formatDate(invoice.created_at)}`}
        />
        <Badge tone={tones[invoice.status as keyof typeof tones] ?? "slate"} className="text-sm">
          {invoice.status}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 text-right font-medium">Qty</th>
                <th className="px-5 py-3 text-right font-medium">Unit price</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(items ?? []).map((it) => (
                <tr key={it.id}>
                  <td className="px-5 py-3">{it.label}</td>
                  <td className="px-5 py-3 text-right">{Number(it.qty)}</td>
                  <td className="px-5 py-3 text-right">{formatCents(it.unit_price_cents)}</td>
                  <td className="px-5 py-3 text-right font-medium">{formatCents(it.line_total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-1 border-t border-slate-200 px-5 py-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatCents(invoice.subtotal_cents)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tax ({(Number(invoice.tax_rate) * 100).toFixed(2)}%)</span><span>{formatCents(invoice.tax_cents)}</span></div>
            <div className="flex justify-between pt-1 text-base font-bold text-slate-900"><span>Total</span><span>{formatCents(invoice.total_cents)}</span></div>
            <div className="flex justify-between text-accent-700"><span>Paid</span><span>{formatCents(invoice.amount_paid_cents)}</span></div>
            {due > 0 && <div className="flex justify-between font-semibold"><span>Balance due</span><span>{formatCents(due)}</span></div>}
          </div>
        </CardContent>
      </Card>

      {(payments ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100">
              {(payments ?? []).map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span>
                    {formatCents(p.amount_cents)} · {p.provider}
                    {p.provider_ref ? ` · ${p.provider_ref}` : ""}
                    <span className="text-slate-500"> · {formatDate(p.created_at)}</span>
                  </span>
                  <Badge tone={p.status === "succeeded" ? "accent" : "slate"}>{p.status}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(nextActions[invoice.status] ?? []).map((a) => (
              <form key={a.status} action={async () => { "use server"; await setInvoiceStatus(id, a.status); }}>
                <Button type="submit" variant="outline">{a.label}</Button>
              </form>
            ))}
            {invoice.status === "draft" && (
              <form action={async () => { "use server"; await deleteInvoice(id); }}>
                <Button type="submit" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                  Delete draft
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {["sent", "overdue"].includes(invoice.status) && due > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Record offline payment</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                action={async (formData) => {
                  "use server";
                  const r = await recordPayment(id, formData);
                  if (r?.error) throw new Error(r.error);
                }}
                className="flex flex-wrap items-end gap-3"
              >
                <div className="w-36">
                  <Field id="pay-amount" name="amount" label="Amount ($)" type="number" min="0.01" step="0.01" required defaultValue={(due / 100).toFixed(2)} />
                </div>
                <div className="min-w-40 flex-1">
                  <Field id="pay-ref" name="reference" label="Reference" placeholder="Check #, cash…" />
                </div>
                <Button type="submit">Record</Button>
              </form>
              <p className="mt-2 text-xs text-slate-500">
                Online card payments unlock after connecting Stripe (Billing page).
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <p className="text-sm">
        <Link href="/dashboard/invoices" className="font-medium text-brand-600 hover:text-brand-700">
          ← All invoices
        </Link>
      </p>
    </div>
  );
}
