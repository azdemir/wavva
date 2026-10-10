import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { setQuoteStatus, deleteQuote } from "@/lib/actions/quotes";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {type QuoteStatus} from "@/components/ui/badge";
import { TQuoteStatusPill } from "@/components/ui/translated-status-pill";
import { PrinterIcon } from "@/components/ui/icons";
import { formatCents, formatDate } from "@/lib/format";
import { one } from "@/lib/relations";
import { FollowupStatus } from "@/components/quotes/followup-status";
import { PortalLinkButton } from "@/components/portal/portal-link-button";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requirePermission("quotes.manage");
  const t = await getTranslations("quotes");
  const supabase = await createClient();

  const nextActions: Record<string, { status: string; label: string; variant?: "primary" | "outline" }[]> = {
    draft: [{ status: "sent", label: t("detail.markSent") }, { status: "expired", label: t("detail.expire"), variant: "outline" }],
    sent: [
      { status: "approved", label: t("detail.approve") },
      { status: "declined", label: t("detail.decline"), variant: "outline" },
      { status: "expired", label: t("detail.expire"), variant: "outline" },
    ],
    approved: [],
    declined: [],
    expired: [],
  };

  // One round trip: line items come embedded with the parent quote,
  // ordered server-side via the referenced table.
  const { data: quote } = await supabase
    .from("quotes")
    .select("*, customers(id, name, email, phone), quote_line_items(*)")
    .eq("id", id)
    .eq("company_id", company.id)
    .order("sort", { referencedTable: "quote_line_items", ascending: true })
    .single();
  if (!quote) notFound();

  const items = (quote.quote_line_items ?? []) as {
    id: string;
    label: string;
    kind: string;
    qty: number;
    unit_price_cents: number;
    line_total_cents: number;
  }[];

  const customer = one(quote.customers) as { id: string; name: string; email: string | null; phone: string | null } | null;

  const h = await headers();
  const baseUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Heading
          title={t("detail.title", { number: quote.quote_number })}
          description={t("detail.description", {
            name: customer?.name ?? t("detail.unknownCustomer"),
            date: formatDate(quote.created_at),
          })}
        />
        <div className="flex items-center gap-2">
          <TQuoteStatusPill status={quote.status as QuoteStatus} className="text-sm" />
          <Button href={`/dashboard/quotes/${id}/print`} variant="outline" size="sm">
            <PrinterIcon className="h-4 w-4" /> {t("detail.print")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.lineItems")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 dark:text-slate-500">
                <th className="px-5 py-3 font-medium">{t("detail.descriptionCol")}</th>
                <th className="px-5 py-3 text-right font-medium">{t("detail.qtyCol")}</th>
                <th className="px-5 py-3 text-right font-medium">{t("detail.unitPriceCol")}</th>
                <th className="px-5 py-3 text-right font-medium">{t("detail.totalCol")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(items ?? []).map((it) => (
                <tr key={it.id}>
                  <td className="px-5 py-3">
                    {it.label}
                    <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">{t(`kinds.${it.kind}`)}</span>
                  </td>
                  <td className="px-5 py-3 text-right">{Number(it.qty)}</td>
                  <td className="px-5 py-3 text-right">{formatCents(it.unit_price_cents)}</td>
                  <td className="px-5 py-3 text-right font-medium">{formatCents(it.line_total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="space-y-1 border-t border-slate-200 dark:border-slate-800 px-5 py-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{t("detail.subtotal")}</span><span>{formatCents(quote.subtotal_cents)}</span></div>
            {quote.discount_cents > 0 && (
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{t("detail.discount")}</span><span>−{formatCents(quote.discount_cents)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{t("detail.tax", { rate: (Number(quote.tax_rate) * 100).toFixed(2) })}</span><span>{formatCents(quote.tax_cents)}</span></div>
            <div className="flex justify-between pt-1 text-base font-bold text-slate-900 dark:text-slate-100"><span>{t("detail.total")}</span><span>{formatCents(quote.total_cents)}</span></div>
          </div>
        </CardContent>
      </Card>

      {(quote.notes || quote.valid_until) && (
        <Card>
          <CardContent className="space-y-2 pt-6 text-sm">
            {quote.valid_until && (
              <p><span className="font-medium text-slate-700 dark:text-slate-300">{t("detail.validUntilLabel")}</span> {formatDate(quote.valid_until)}</p>
            )}
            {quote.notes && (
              <p><span className="font-medium text-slate-700 dark:text-slate-300">{t("detail.notesLabel")}</span> {quote.notes}</p>
            )}
          </CardContent>
        </Card>
      )}

      {quote.status === "sent" && (
        <FollowupStatus quoteId={id} companyId={company.id} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.actionsTitle")}</CardTitle>
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
              {t("detail.createBooking")}
            </Button>
          )}
          {quote.status === "draft" && (
            <form
              action={async () => {
                "use server";
                await deleteQuote(id);
              }}
            >
              <Button type="submit" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950">
                {t("detail.deleteDraft")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {customer && (
        <Card>
          <CardHeader>
            <CardTitle>{t("detail.portalTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
              {t("detail.portalDescription")}
            </p>
            <PortalLinkButton
              customerId={customer.id}
              baseUrl={baseUrl}
              customerName={customer.name}
              customerEmail={customer.email}
              customerPhone={customer.phone}
            />
          </CardContent>
        </Card>
      )}

      <p className="text-sm">
        <Link href="/dashboard/quotes" className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400">
          {t("detail.allQuotes")}
        </Link>
      </p>
    </div>
  );
}
