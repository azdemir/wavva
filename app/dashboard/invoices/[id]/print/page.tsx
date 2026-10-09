import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { formatCents, formatDate } from "@/lib/format";
import { statusLabel } from "@/components/ui/badge";
import { PrintDocument } from "@/components/documents/print-document";
import { PrintButton } from "@/components/documents/print-button";

export const instant = false;

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requirePermission("invoices.manage");
  const supabase = await createClient();

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
    { label: "Subtotal", value: formatCents(invoice.subtotal_cents) },
    {
      label: `Tax (${(Number(invoice.tax_rate) * 100).toFixed(2)}%)`,
      value: formatCents(invoice.tax_cents),
    },
    { label: "Total", value: formatCents(invoice.total_cents), strong: true },
    { label: "Paid", value: formatCents(invoice.amount_paid_cents) },
  ];
  if (due > 0) totals.push({ label: "Balance due", value: formatCents(due), strong: true });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/dashboard/invoices/${id}`}
          className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          ← Back to invoice
        </Link>
        <PrintButton />
      </div>
      <PrintDocument
        company={company}
        kind="Invoice"
        number={invoice.invoice_number}
        status={statusLabel(invoice.status)}
        meta={[
          { label: "Issue date", value: formatDate(invoice.created_at) },
          { label: "Due date", value: invoice.due_date ? formatDate(invoice.due_date) : "—" },
        ]}
        customer={{
          name: customer?.name ?? "Customer",
          email: customer?.email ?? null,
          phone: customer?.phone ?? null,
        }}
        items={items}
        totals={totals}
        notes={invoice.notes}
        footerNote={`Thank you for your business! · ${company.name}${company.phone ? ` · ${company.phone}` : ""}`}
      />
    </div>
  );
}
