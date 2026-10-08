import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setQuoteStatus, deleteQuote } from "@/lib/actions/quotes";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCents, formatDate } from "@/lib/format";
import { one } from "@/lib/relations";

const tones = { draft: "slate", sent: "brand", approved: "accent", declined: "red", expired: "slate" } as const;

const nextActions: Record<string, { status: string; label: string; variant?: "primary" | "outline" }[]> = {
  draft: [{ status: "sent", label: "Mark as sent" }, { status: "expired", label: "Expire", variant: "outline" }],
  sent: [
    { status: "approved", label: "Approve" },
    { status: "declined", label: "Decline", variant: "outline" },
    { status: "expired", label: "Expire", variant: "outline" },
  ],
  approved: [],
  declined: [],
  expired: [],
};

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requireCompany();
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, customers(id, name, email, phone)")
    .eq("id", id)
    .eq("company_id", company.id)
    .single();
  if (!quote) notFound();

  const { data: items } = await supabase
    .from("quote_line_items")
    .select("*")
    .eq("quote_id", id)
    .order("sort", { ascending: true });

  const customer = one(quote.customers) as { id: string; name: string; email: string | null; phone: string | null } | null;

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Heading
          title={`Quote ${quote.quote_number}`}
          description={`${customer?.name ?? "Customer"} · created ${formatDate(quote.created_at)}`}
        />
        <Badge tone={tones[quote.status as keyof typeof tones] ?? "slate"} className="text-sm">
          {quote.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
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
                  <td className="px-5 py-3">
                    {it.label}
                    <span className="ml-2 text-xs text-slate-400">{it.kind}</span>
                  </td>
                  <td className="px-5 py-3 text-right">{Number(it.qty)}</td>
                  <td className="px-5 py-3 text-right">{formatCents(it.unit_price_cents)}</td>
                  <td className="px-5 py-3 text-right font-medium">{formatCents(it.line_total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-1 border-t border-slate-200 px-5 py-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatCents(quote.subtotal_cents)}</span></div>
            {quote.discount_cents > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>−{formatCents(quote.discount_cents)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-slate-500">Tax ({(Number(quote.tax_rate) * 100).toFixed(2)}%)</span><span>{formatCents(quote.tax_cents)}</span></div>
            <div className="flex justify-between pt-1 text-base font-bold text-slate-900"><span>Total</span><span>{formatCents(quote.total_cents)}</span></div>
          </div>
        </CardContent>
      </Card>

      {(quote.notes || quote.valid_until) && (
        <Card>
          <CardContent className="space-y-2 pt-6 text-sm">
            {quote.valid_until && (
              <p><span className="font-medium text-slate-700">Valid until:</span> {formatDate(quote.valid_until)}</p>
            )}
            {quote.notes && (
              <p><span className="font-medium text-slate-700">Notes:</span> {quote.notes}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(nextActions[quote.status] ?? []).map((a) => (
            <form
              key={a.status}
              action={async () => {
                "use server";
                await setQuoteStatus(id, a.status);
              }}
            >
              <Button type="submit" variant={a.variant ?? "primary"}>
                {a.label}
              </Button>
            </form>
          ))}
          {(quote.status === "approved" || quote.status === "sent") && (
            <Button href={`/dashboard/bookings/new?quoteId=${id}`} variant="outline">
              Create booking
            </Button>
          )}
          {quote.status === "draft" && (
            <form
              action={async () => {
                "use server";
                await deleteQuote(id);
              }}
            >
              <Button type="submit" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                Delete draft
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="text-sm">
        <Link href="/dashboard/quotes" className="font-medium text-brand-600 hover:text-brand-700">
          ← All quotes
        </Link>
      </p>
    </div>
  );
}
