import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoiceStatusPill, statusLabel, type InvoiceStatus } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { parsePageParam, PAGE_SIZE } from "@/lib/pagination";
import { PlusIcon, CardIcon } from "@/components/ui/icons";
import { formatCents, formatDate } from "@/lib/format";

export const instant = false;

const statuses = ["all", "draft", "sent", "overdue", "paid", "void"] as const;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { company } = await requireCompany();
  const supabase = await createClient();
  const params = await searchParams;
  const status = params.status ?? "all";
  const valid = (statuses as readonly string[]).includes(status) ? status : "all";
  const page = parsePageParam(params.page);

  let query = supabase
    .from("invoices")
    .select("id, invoice_number, status, total_cents, amount_paid_cents, due_date, customers(name)", { count: "exact" })
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });
  if (valid !== "all") query = query.eq("status", valid);
  const { data: invoices, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const total = count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading title="Invoices" description="Bill customers and track payments." />
        <Button href="/dashboard/invoices/new">
          <PlusIcon className="h-4 w-4" /> New invoice
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/dashboard/invoices" : `/dashboard/invoices?status=${s}`}
            className={`inline-flex min-h-9 items-center rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${
              valid === s ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
            }`}
          >
            {statusLabel(s)}
          </Link>
        ))}
      </div>

      {(invoices ?? []).length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="No invoices here"
              description="Create an invoice to bill a customer."
              action={<Button href="/dashboard/invoices/new">New invoice</Button>}
              icon={<CardIcon className="h-10 w-10" />}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {(invoices ?? []).map((inv) => {
                const due = inv.total_cents - inv.amount_paid_cents;
                return (
                  <li key={inv.id}>
                    <Link href={`/dashboard/invoices/${inv.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                          {inv.invoice_number} · {one(inv.customers)?.name}
                        </p>
                        <p className="truncate text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                          {inv.due_date ? `Due ${formatDate(inv.due_date)}` : "No due date"}
                          {due > 0 && inv.status !== "draft" && ` · ${formatCents(due)} due`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCents(inv.total_cents)}</span>
                        <InvoiceStatusPill status={inv.status as InvoiceStatus} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
          {total > PAGE_SIZE && (
            <div className="px-5 pb-4">
              <Pagination
                page={page}
                totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
                total={total}
                pageSize={PAGE_SIZE}
                basePath="/dashboard/invoices"
                searchParams={{ status: valid !== "all" ? valid : undefined }}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
