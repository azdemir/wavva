import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {type InvoiceStatus} from "@/components/ui/badge";
import { TInvoiceStatusPill } from "@/components/ui/translated-status-pill";
import { QboSyncBadge } from "@/components/invoices/qbo-sync-badge";
import { getQboBadgeMap } from "@/lib/quickbooks/sync";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { FilterPills, FilterSearch, ExportButton } from "@/components/ui/filters";
import { PeriodSummary } from "@/components/ui/period-summary";
import { PERIODS, parsePeriod, periodStartUtc } from "@/lib/periods";
import { parsePageParam, PAGE_SIZE } from "@/lib/pagination";
import { PlusIcon, CardIcon } from "@/components/ui/icons";
import { formatCents, formatDate } from "@/lib/format";
import { getTranslations } from "next-intl/server";

export const instant = false;

const statuses = ["all", "draft", "sent", "overdue", "paid", "void"] as const;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; period?: string }>;
}) {
  const { company } = await requirePermission("invoices.manage");
  const supabase = await createClient();
  const params = await searchParams;
  const status = params.status ?? "all";
  const valid = (statuses as readonly string[]).includes(status) ? status : "all";
  const period = parsePeriod(params.period);
  const periodStart = periodStartUtc(company.timezone || "America/New_York", period);
  const q = (params.q ?? "").trim();
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const page = parsePageParam(params.page);
  const t = await getTranslations("invoices");

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
    .select("id, invoice_number, status, total_cents, amount_paid_cents, due_date, qbo_id, customers(name)", { count: "exact" })
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });
  if (valid !== "all") query = query.eq("status", valid);
  if (periodStart) query = query.gte("created_at", periodStart);
  if (q) {
    query =
      customerIds && customerIds.length > 0
        ? query.or(`invoice_number.ilike.${like},customer_id.in.(${customerIds.join(",")})`)
        : query.ilike("invoice_number", like);
  }
  const { data: invoices, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const qboBadges = await getQboBadgeMap(
    company.id,
    (invoices ?? []).map((inv) => ({ id: inv.id as string, qbo_id: (inv.qbo_id as string | null) ?? null })),
  );
  const total = count ?? 0;
  const filtering = valid !== "all" || q !== "" || period !== "all";
  const keep = {
    status: valid !== "all" ? valid : undefined,
    q: q || undefined,
    period: period !== "all" ? period : undefined,
  };
  const exportQs = new URLSearchParams(
    Object.entries(keep).filter(([, v]) => v !== undefined) as [string, string][],
  ).toString();

  // Totals for the same filtered set (supabase-js caps a single select at
  // 1000 rows, so page through for a correct total).
  let agg = supabase
    .from("invoices")
    .select("total_cents, amount_paid_cents")
    .eq("company_id", company.id);
  if (valid !== "all") agg = agg.eq("status", valid);
  if (periodStart) agg = agg.gte("created_at", periodStart);
  if (q) {
    agg =
      customerIds && customerIds.length > 0
        ? agg.or(`invoice_number.ilike.${like},customer_id.in.(${customerIds.join(",")})`)
        : agg.ilike("invoice_number", like);
  }
  let sumTotal = 0;
  let sumPaid = 0;
  let aggCount = 0;
  const BATCH = 1000;
  for (let offset = 0; ; offset += BATCH) {
    const { data: rows } = await agg.range(offset, offset + BATCH - 1);
    const batch = rows ?? [];
    if (batch.length === 0) break;
    for (const r of batch) {
      sumTotal += (r.total_cents as number) ?? 0;
      sumPaid += (r.amount_paid_cents as number) ?? 0;
      aggCount += 1;
    }
    if (batch.length < BATCH) break;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading title={t("list.title")} description={t("list.description")} />
        <div className="flex flex-wrap gap-2">
          <ExportButton href={`/api/exports/invoices${exportQs ? `?${exportQs}` : ""}`} />
          <Button href="/dashboard/invoices/new">
            <PlusIcon className="h-4 w-4" /> {t("list.newInvoice")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FilterPills
          basePath="/dashboard/invoices"
          param="status"
          options={statuses.map((s) => ({ value: s, label: t(`list.status.${s}`) }))}
          current={valid}
          preserve={{ q: q || undefined, period: period !== "all" ? period : undefined }}
        />
        <FilterSearch
          id="invoice-search"
          label={t("list.searchLabel")}
          defaultValue={q}
          placeholder={t("list.searchPlaceholder")}
          preserve={{ status: valid !== "all" ? valid : undefined, period: period !== "all" ? period : undefined }}
        />
      </div>

      <FilterPills
        basePath="/dashboard/invoices"
        param="period"
        options={PERIODS.map((p) => ({ value: p, label: t(`list.period.${p}`) }))}
        current={period}
        preserve={{ status: valid !== "all" ? valid : undefined, q: q || undefined }}
      />

      {aggCount > 0 && (
        <PeriodSummary
          title={t(`list.period.${period}`)}
          stats={[
            { label: t("list.summary.total"), value: formatCents(sumTotal) },
            { label: t("list.summary.collected"), value: formatCents(sumPaid) },
            { label: t("list.summary.outstanding"), value: formatCents(sumTotal - sumPaid) },
            { label: t("list.summary.count"), value: String(aggCount) },
          ]}
        />
      )}

      {(invoices ?? []).length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title={filtering ? t("list.emptyFilteredTitle") : t("list.emptyTitle")}
              description={
                filtering
                  ? t("list.emptyFilteredDescription")
                  : t("list.emptyDescription")
              }
              action={filtering ? undefined : <Button href="/dashboard/invoices/new">{t("list.newInvoice")}</Button>}
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
                          {inv.due_date ? t("list.dueOn", { date: formatDate(inv.due_date) }) : t("list.noDueDate")}
                          {due > 0 && inv.status !== "draft" && ` · ${t("list.dueAmount", { amount: formatCents(due) })}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCents(inv.total_cents)}</span>
                        <TInvoiceStatusPill status={inv.status as InvoiceStatus} />
                        {qboBadges?.get(inv.id as string) && (
                          <QboSyncBadge status={qboBadges.get(inv.id as string)!} />
                        )}
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
