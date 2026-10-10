import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { setInvoiceStatus, recordPayment, markInvoicePaid, deleteInvoice } from "@/lib/actions/invoices";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Badge, statusLabel, type InvoiceStatus } from "@/components/ui/badge";
import { TInvoiceStatusPill } from "@/components/ui/translated-status-pill";
import { Field } from "@/components/ui/input";
import { PrinterIcon } from "@/components/ui/icons";
import { InvoiceNumberEditor } from "@/components/invoices/invoice-number-editor";
import { QboSyncBadge } from "@/components/invoices/qbo-sync-badge";
import { PortalLinkButton } from "@/components/portal/portal-link-button";
import { getInvoiceSyncStatus } from "@/lib/quickbooks/sync";
import { formatCents, formatDate } from "@/lib/format";
import { getTranslations } from "next-intl/server";

export const instant = false;

type DetailActionLabel = "detail.markSent" | "detail.markPaid" | "detail.markOverdue" | "detail.void";

const nextActions: Record<string, { status: string; label: DetailActionLabel }[]> = {
  draft: [{ status: "sent", label: "detail.markSent" }, { status: "void", label: "detail.void" }],
  sent: [{ status: "paid", label: "detail.markPaid" }, { status: "overdue", label: "detail.markOverdue" }, { status: "void", label: "detail.void" }],
  overdue: [{ status: "paid", label: "detail.markPaid" }, { status: "void", label: "detail.void" }],
  // A paid invoice can only be voided — the record and its payments stay on
  // the books. Voiding always asks for confirmation (see below).
  paid: [{ status: "void", label: "detail.void" }],
  void: [],
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requirePermission("invoices.manage");
  const supabase = await createClient();
  const t = await getTranslations("invoices");
  const tc = await getTranslations("common");
  const paymentStatusLabel = (s: string) =>
    ["succeeded", "failed", "pending", "refunded"].includes(s)
      ? tc(`status.payment.${s}`)
      : statusLabel(s);

  // One round trip: line items and payments come embedded with the
  // parent invoice, ordered server-side via the referenced tables.
  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "*, customers(id, name, email, phone), bookings(booking_number), invoice_line_items(*), payments(*)",
    )
    .eq("id", id)
    .eq("company_id", company.id)
    .order("sort", { referencedTable: "invoice_line_items", ascending: true })
    .order("created_at", { referencedTable: "payments", ascending: false })
    .single();
  if (!invoice) notFound();

  const items = (invoice.invoice_line_items ?? []) as {
    id: string;
    label: string;
    qty: number;
    unit_price_cents: number;
    line_total_cents: number;
  }[];
  const payments = (invoice.payments ?? []) as {
    id: string;
    amount_cents: number;
    provider: string;
    provider_ref: string | null;
    created_at: string;
    status: string;
  }[];

  const customer = one(invoice.customers);
  const due = invoice.total_cents - invoice.amount_paid_cents;

  const h = await headers();
  const baseUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const qboStatus = await getInvoiceSyncStatus(company.id, {
    id: invoice.id,
    qbo_id: (invoice.qbo_id as string | null) ?? null,
  });

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Heading
            title={t("detail.title", { number: invoice.invoice_number })}
            description={t("detail.subtitle", {
              name: customer?.name ?? t("detail.unknownCustomer"),
              date: formatDate(invoice.created_at),
            })}
          />
          <InvoiceNumberEditor invoiceId={id} current={invoice.invoice_number} />
        </div>
        <div className="flex items-center gap-2">
          <TInvoiceStatusPill status={invoice.status as InvoiceStatus} className="text-sm" />
          <QboSyncBadge status={qboStatus} />
          <Button href={`/dashboard/invoices/${id}/print`} variant="outline" size="sm">
            <PrinterIcon className="h-4 w-4" /> {t("detail.print")}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 dark:text-slate-500">
                <th className="px-5 py-3 font-medium">{t("detail.description")}</th>
                <th className="px-5 py-3 text-right font-medium">{t("detail.qty")}</th>
                <th className="px-5 py-3 text-right font-medium">{t("detail.unitPrice")}</th>
                <th className="px-5 py-3 text-right font-medium">{t("detail.total")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
          </div>
          <div className="space-y-1 border-t border-slate-200 dark:border-slate-800 px-5 py-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{t("detail.subtotal")}</span><span>{formatCents(invoice.subtotal_cents)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{t("detail.tax", { rate: (Number(invoice.tax_rate) * 100).toFixed(2) })}</span><span>{formatCents(invoice.tax_cents)}</span></div>
            <div className="flex justify-between pt-1 text-base font-bold text-slate-900 dark:text-slate-100"><span>{t("detail.total")}</span><span>{formatCents(invoice.total_cents)}</span></div>
            <div className="flex justify-between text-accent-700"><span>{t("detail.paid")}</span><span>{formatCents(invoice.amount_paid_cents)}</span></div>
            {due > 0 && <div className="flex justify-between font-semibold"><span>{t("detail.balanceDue")}</span><span>{formatCents(due)}</span></div>}
          </div>
        </CardContent>
      </Card>

      {(payments ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("detail.payments")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {(payments ?? []).map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span>
                    {formatCents(p.amount_cents)} · {p.provider}
                    {p.provider_ref ? ` · ${p.provider_ref}` : ""}
                    <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500"> · {formatDate(p.created_at)}</span>
                  </span>
                  <Badge tone={p.status === "succeeded" ? "accent" : "slate"}>{paymentStatusLabel(p.status)}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("detail.status")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(nextActions[invoice.status] ?? []).map((a) => {
              if (a.status === "void") {
                return (
                  <ConfirmActionButton
                    key={a.status}
                    label={t(a.label)}
                    confirmMessage="Void this invoice? The record and its payments will be kept for your books."
                    pendingLabel="Voiding…"
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                    action={async () => { "use server"; return setInvoiceStatus(id, "void"); }}
                  />
                );
              }
              if (a.status === "paid") {
                // Records a manual payment for the remaining balance first,
                // so the invoice truthfully shows Paid $X / $0 due.
                return (
                  <form key={a.status} action={async () => { "use server"; const r = await markInvoicePaid(id); if (r?.error) throw new Error(r.error); }}>
                    <Button type="submit" variant="outline">{t(a.label)}</Button>
                  </form>
                );
              }
              return (
                <form key={a.status} action={async () => { "use server"; await setInvoiceStatus(id, a.status); }}>
                  <Button type="submit" variant="outline">{t(a.label)}</Button>
                </form>
              );
            })}
            {invoice.status === "draft" && (
              <form action={async () => { "use server"; await deleteInvoice(id); }}>
                <Button type="submit" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950">
                  {t("detail.deleteDraft")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {["sent", "overdue"].includes(invoice.status) && due > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("detail.recordOfflinePayment")}</CardTitle>
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
                  <Field id="pay-amount" name="amount" label={t("detail.amount")} type="number" min="0.01" step="0.01" required defaultValue={(due / 100).toFixed(2)} />
                </div>
                <div className="min-w-40 flex-1">
                  <Field id="pay-ref" name="reference" label={t("detail.reference")} placeholder={t("detail.referencePlaceholder")} />
                </div>
                <Button type="submit">{t("detail.record")}</Button>
              </form>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
                {t("detail.onlinePaymentsNote")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

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
              customerId={customer.id as string}
              baseUrl={baseUrl}
              customerName={customer.name as string}
              customerEmail={(customer.email as string | null) ?? null}
              customerPhone={(customer.phone as string | null) ?? null}
            />
          </CardContent>
        </Card>
      )}

      <p className="text-sm">
        <Link href="/dashboard/invoices" className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400">
          {t("detail.allInvoices")}
        </Link>
      </p>
    </div>
  );
}
