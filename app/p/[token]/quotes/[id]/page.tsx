import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortalContext } from "@/lib/portal";
import { createServiceClient } from "@/lib/supabase/server";
import { portalSetQuoteStatus } from "@/lib/actions/portal";
import { PortalShell, PortalInvalid } from "@/components/portal/portal-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuoteStatusPill, type QuoteStatus } from "@/components/ui/badge";
import { formatCents, formatDate } from "@/lib/format";

export const instant = false;

/** Customer portal: review and approve/decline a quote. */
export default async function PortalQuotePage({
  params,
}: {
  params: Promise<{ token: string; id: string }>;
}) {
  const { token, id } = await params;
  const ctx = await getPortalContext(token);
  if (!ctx) return <PortalInvalid />;

  const svc = await createServiceClient();
  const { data: quote } = await svc
    .from("quotes")
    .select("*")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .eq("customer_id", ctx.customer.id)
    .single();
  if (!quote) notFound();

  const { data: items } = await svc
    .from("quote_line_items")
    .select("*")
    .eq("quote_id", id)
    .order("sort", { ascending: true });

  return (
    <PortalShell companyName={ctx.company.name} customerName={ctx.customer.name}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Quote {quote.quote_number}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {quote.valid_until ? `Valid until ${formatDate(quote.valid_until)}` : "No expiry set"}
            </p>
          </div>
          <QuoteStatusPill status={quote.status as QuoteStatus} />
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
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
            <div className="space-y-1 border-t border-slate-200 px-5 py-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatCents(quote.subtotal_cents)}</span></div>
              {quote.discount_cents > 0 && (
                <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>−{formatCents(quote.discount_cents)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{formatCents(quote.tax_cents)}</span></div>
              <div className="flex justify-between pt-1 text-base font-bold text-slate-900"><span>Total</span><span>{formatCents(quote.total_cents)}</span></div>
            </div>
          </CardContent>
        </Card>

        {quote.notes && (
          <Card>
            <CardContent className="pt-6 text-sm text-slate-600">{quote.notes}</CardContent>
          </Card>
        )}

        {quote.status === "sent" && (
          <Card>
            <CardHeader>
              <CardTitle>Your decision</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <form action={async () => { "use server"; await portalSetQuoteStatus(token, id, "approved"); }}>
                <Button type="submit">Approve quote</Button>
              </form>
              <form action={async () => { "use server"; await portalSetQuoteStatus(token, id, "declined"); }}>
                <Button type="submit" variant="outline">Decline</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {quote.status !== "sent" && (
          <p className="text-sm text-slate-500">
            You {quote.status === "approved" ? "approved" : quote.status} this quote.{" "}
            {ctx.company.phone && <>Questions? Call {ctx.company.phone}.</>}
          </p>
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
