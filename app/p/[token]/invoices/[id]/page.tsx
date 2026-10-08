import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPortalContext } from "@/lib/portal";
import { createServiceClient } from "@/lib/supabase/server";
import { PortalShell, PortalInvalid } from "@/components/portal/portal-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceStatusPill, type InvoiceStatus } from "@/components/ui/badge";
import { PayButton } from "@/components/portal/pay-button";
import { formatCents, formatDate } from "@/lib/format";

export const instant = false;

/** Customer portal: view and pay an invoice. */
export default async function PortalInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { token, id } = await params;
  const { paid } = await searchParams;
  const ctx = await getPortalContext(token);
  if (!ctx) return <PortalInvalid />;

  const svc = await createServiceClient();
  const { data: invoice } = await svc
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .eq("customer_id", ctx.customer.id)
    .single();
  if (!invoice) notFound();

  const { data: items } = await svc
    .from("invoice_line_items")
    .select("*")
    .eq("invoice_id", id)
    .order("sort", { ascending: true });

  const h = await headers();
  const baseUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const due = invoice.total_cents - invoice.amount_paid_cents;
  const payable = ["sent", "overdue"].includes(invoice.status) && due > 0;

  return (
    <PortalShell companyName={ctx.company.name} customerName={ctx.customer.name}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Invoice {invoice.invoice_number}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {invoice.due_date ? `Due ${formatDate(invoice.due_date)}` : "No due date"}
            </p>
          </div>
          <InvoiceStatusPill status={invoice.status as InvoiceStatus} />
        </div>

        {paid && (
          <div role="status" className="rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800">
            Thank you — your payment is being processed.
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <tbody className="divide-y divide-slate-100">
                {(items ?? []).map((it) => (
                  <tr key={it.id}>
                    <td className="px-5 py-3">
                      {it.label}
                      <span className="block text-xs text-slate-400">
                        Qty {Number(it.qty)} × {formatCents(it.unit_price_cents)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium">
                      {formatCents(it.line_total_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="space-y-1 border-t border-slate-200 px-5 py-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatCents(invoice.subtotal_cents)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{formatCents(invoice.tax_cents)}</span></div>
              <div className="flex justify-between pt-1 text-base font-bold text-slate-900"><span>Total</span><span>{formatCents(invoice.total_cents)}</span></div>
              <div className="flex justify-between text-accent-700"><span>Paid</span><span>{formatCents(invoice.amount_paid_cents)}</span></div>
              {due > 0 && <div className="flex justify-between font-semibold"><span>Balance due</span><span>{formatCents(due)}</span></div>}
            </div>
          </CardContent>
        </Card>

        {payable && (
          <Card>
            <CardHeader>
              <CardTitle>Pay {formatCents(due)}</CardTitle>
            </CardHeader>
            <CardContent>
              <PayButton token={token} invoiceId={id} baseUrl={baseUrl} label={`Pay ${formatCents(due)} by card`} />
              <p className="mt-2 text-xs text-slate-500">
                Secure card payment. Prefer cash or check? Contact {ctx.company.name} directly.
              </p>
            </CardContent>
          </Card>
        )}

        <p className="text-sm">
          <Link href={`/p/${token}`} className="font-medium text-brand-600 hover:text-brand-700">
            ← Back to overview
          </Link>
        </p>
      </div>
    </PortalShell>
  );
}
