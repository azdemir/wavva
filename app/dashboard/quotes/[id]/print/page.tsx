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

export default async function QuotePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requirePermission("quotes.manage");
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, customers(name, email, phone), quote_line_items(*)")
    .eq("id", id)
    .eq("company_id", company.id)
    .order("sort", { referencedTable: "quote_line_items", ascending: true })
    .single();
  if (!quote) notFound();

  const items = ((quote.quote_line_items ?? []) as {
    label: string;
    kind: string;
    qty: number;
    unit_price_cents: number;
    line_total_cents: number;
  }[]).map((it) => ({
    label: it.label,
    sub: statusLabel(it.kind),
    qty: String(Number(it.qty)),
    unitPrice: formatCents(it.unit_price_cents),
    total: formatCents(it.line_total_cents),
  }));

  const customer = one(quote.customers) as {
    name: string;
    email: string | null;
    phone: string | null;
  } | null;

  const totals = [
    { label: "Subtotal", value: formatCents(quote.subtotal_cents) },
    ...(quote.discount_cents > 0
      ? [{ label: "Discount", value: `−${formatCents(quote.discount_cents)}` }]
      : []),
    {
      label: `Tax (${(Number(quote.tax_rate) * 100).toFixed(2)}%)`,
      value: formatCents(quote.tax_cents),
    },
    { label: "Total", value: formatCents(quote.total_cents), strong: true },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/dashboard/quotes/${id}`}
          className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          ← Back to quote
        </Link>
        <PrintButton />
      </div>
      <PrintDocument
        company={company}
        kind="Quote"
        number={quote.quote_number}
        status={statusLabel(quote.status)}
        meta={[
          { label: "Issue date", value: formatDate(quote.created_at) },
          { label: "Valid until", value: quote.valid_until ? formatDate(quote.valid_until) : "—" },
        ]}
        customer={{
          name: customer?.name ?? "Customer",
          email: customer?.email ?? null,
          phone: customer?.phone ?? null,
        }}
        items={items}
        totals={totals}
        notes={quote.notes}
        footerNote={`${company.name}${company.phone ? ` · ${company.phone}` : ""}${company.email ? ` · ${company.email}` : ""}`}
      />
    </div>
  );
}
