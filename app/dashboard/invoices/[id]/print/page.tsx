import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { formatCents, formatDate } from "@/lib/format";

import { PrintDocument } from "@/components/documents/print-document";
import { PrintButton } from "@/components/documents/print-button";
import { getTranslations } from "next-intl/server";

export const instant = false;

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requirePermission("invoices.manage");
  const supabase = await createClient();
  const t = await getTranslations("invoices");

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, customers(name, email, phone), invoice_line_items(*)")
    .eq("id", id)
    .eq("company_id", company.id)
    .order("sort", { referencedTable: "invoice_line_items", ascending: true })
    .single();
  if (!invoice) notFound();

  const items = ((invoice.invoice_line_items ?? []) as {
    label: string;
    qty: number;
    unit_price_cents: number;
    line_total_cents: number;
  }[]).map((it) => ({
    label: it.label,
    qty: String(Number(it.qty)),
    unitPrice: formatCents(it.unit_price_cents),
    total: formatCents(it.line_total_cents),
  }));

  const customer = one(invoice.customers) as {
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  const due = invoice.total_cents - invoice.amount_paid_cents;

  const totals = [
    { label: t("print.subtotal"), value: formatCents(invoice.subtotal_cents) },
    {
      label: t("print.tax", { rate: (Number(invoice.tax_rate) * 100).toFixed(2) }),
      value: formatCents(invoice.tax_cents),
    },
    { label: t("print.total"), value: formatCents(invoice.total_cents), strong: true },
    { label: t("print.paid"), value: formatCents(invoice.amount_paid_cents) },
  ];
  if (due > 0) totals.push({ label: t("print.balanceDue"), value: formatCents(due), strong: true });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/dashboard/invoices/${id}`}
          className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          {t("print.backToInvoice")}
        </Link>
        <PrintButton />
      </div>
      <PrintDocument
        company={company}
        kind={t("print.documentKind") as "Invoice" | "Quote"}
        number={invoice.invoice_number}
        status={t(`list.status.${invoice.status}`)}
        meta={[
          { label: t("print.issueDate"), value: formatDate(invoice.created_at) },
          { label: t("print.dueDate"), value: invoice.due_date ? formatDate(invoice.due_date) : "—" },
        ]}
        customer={{
          name: customer?.name ?? t("print.customerFallback"),
          // Email is intentionally hidden on the printed invoice.
          email: null,
          phone: customer?.phone ?? null,
        }}
        items={items}
        totals={totals}
        notes={invoice.notes}
        footerNote={`${t("print.footerNote", { company: company.name })}${company.phone ? ` · ${company.phone}` : ""}`}
      />
    </div>
  );
}
