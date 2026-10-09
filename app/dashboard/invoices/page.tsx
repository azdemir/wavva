import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoiceStatusPill, type InvoiceStatus } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { FilterPills, FilterSearch, ExportButton } from "@/components/ui/filters";
import { parsePageParam, PAGE_SIZE } from "@/lib/pagination";
import { PlusIcon, CardIcon } from "@/components/ui/icons";
import { formatCents, formatDate } from "@/lib/format";

export const instant = false;

const statuses = ["all", "draft", "sent", "overdue", "paid", "void"] as const;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { company } = await requirePermission("invoices.manage");
  const supabase = await createClient();
  const params = await searchParams;
  const status = params.status ?? "all";
  const valid = (statuses as readonly string[]).includes(status) ? status : "all";
  const q = (params.q ?? "").trim();
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const page = parsePageParam(params.page);

  let customerIds: string[] | null = null;
  if (q) {
    const { data: matched } = await supabase
      .from("customers")
      .select("id")
      .eq("company_id", company.id)
      .ilike("name", like);
    customerIds = (matched ?? []).map((m) => m.id as string);
  }

  let query = supabase
    .from("invoices")
    .select("id, invoice_number, status, total_cents, amount_paid_cents, due_date, customers(name)", { count: "exact" })
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });
  if (valid !== "all") query = query.eq("status", valid);
  if (q) {
    query =
      customerIds && customerIds.length > 0
        ? query.or(`invoice_number.ilike.${like},customer_id.in.(${customerIds.join(",")})`)
        : query.ilike("invoice_number", like);
  }
  const { data: invoices, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const total = count ?? 0;
  const filtering = valid !== "all" || q !== "";
  const keep = { status: valid !== "all" ? valid : undefined, q: q || undefined };
  const exportQs = new URLSearchParams(
    Object.entries(keep).filter(([, v]) => v !== undefined) as [string, string][],
  ).toString();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading title="Invoices" description="Bill customers and track payments." />
        <div className="flex flex-wrap gap-2">
          <ExportButton href={`/api/exports/invoices${exportQs ? `?${exportQs}` : ""}`} />
          <Button href="/dashboard/invoices/new">
            <PlusIcon className="h-4 w-4" /> New invoice
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FilterPills
          basePath="/dashboard/invoices"
          param="status"
          options={statuses.map((s) => ({ value: s }))}
          current={valid}
          preserve={{ q: q || undefined }}
        />
        <FilterSearch
          id="invoice-search"
          label="Search invoices"
          defaultValue={q}
          placeholder="Invoice # or customer name…"
          preserve={{ status: valid !== "all" ? valid : undefined }}
        />
      </div>

      {(invoices ?? []).length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title={filtering ? "No invoices match" : "No invoices here"}
              description={
                filtering
                  ? "Try a different search or status."
                  : "Create an invoice to bill a customer."
              }
              action={filtering ? undefined : <Button href="/dashboard/invoices/new">New invoice</Button>}
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
                searchParams={keep}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
