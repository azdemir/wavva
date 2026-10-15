import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {type QuoteStatus} from "@/components/ui/badge";
import { TQuoteStatusPill } from "@/components/ui/translated-status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { parsePageParam, PAGE_SIZE } from "@/lib/pagination";
import { PlusIcon, QuoteIcon } from "@/components/ui/icons";
import { formatCents, formatDate } from "@/lib/format";
import { one } from "@/lib/relations";
import { FilterPills, FilterSearch } from "@/components/ui/filters";
import { PeriodSummary } from "@/components/ui/period-summary";
import { PERIODS, parsePeriod, periodStartUtc } from "@/lib/periods";

const statuses = ["all", "draft", "sent", "approved", "declined", "expired"] as const;

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; period?: string }>;
}) {
  const { company } = await requirePermission("quotes.manage");
  const t = await getTranslations("quotes");
  const supabase = await createClient();
  const params = await searchParams;
  const status = params.status ?? "all";
  const valid = statuses.includes(status as (typeof statuses)[number]) ? status : "all";
  const period = parsePeriod(params.period);
  const periodStart = periodStartUtc(company.timezone || "America/New_York", period);
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
    .from("quotes")
    .select("id, quote_number, status, total_cents, valid_until, created_at, customers(name)", { count: "exact" })
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });
  if (valid !== "all") query = query.eq("status", valid);
  if (periodStart) query = query.gte("created_at", periodStart);
  if (q) {
    query =
      customerIds && customerIds.length > 0
        ? query.or(`quote_number.ilike.${like},customer_id.in.(${customerIds.join(",")})`)
        : query.ilike("quote_number", like);
  }

  const { data: quotes, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const total = count ?? 0;
  const filtering = valid !== "all" || q !== "" || period !== "all";
  const keep = {
    status: valid !== "all" ? valid : undefined,
    q: q || undefined,
    period: period !== "all" ? period : undefined,
  };

  // Totals for the same filtered set (supabase-js caps a single select at
  // 1000 rows, so page through for a correct total).
  let agg = supabase
    .from("quotes")
    .select("total_cents, status")
    .eq("company_id", company.id);
  if (valid !== "all") agg = agg.eq("status", valid);
  if (periodStart) agg = agg.gte("created_at", periodStart);
  if (q) {
    agg =
      customerIds && customerIds.length > 0
        ? agg.or(`quote_number.ilike.${like},customer_id.in.(${customerIds.join(",")})`)
        : agg.ilike("quote_number", like);
  }
  let sumTotal = 0;
  let sumApproved = 0;
  let aggCount = 0;
  const BATCH = 1000;
  for (let offset = 0; ; offset += BATCH) {
    const { data: rows } = await agg.range(offset, offset + BATCH - 1);
    const batch = rows ?? [];
    if (batch.length === 0) break;
    for (const r of batch) {
      sumTotal += (r.total_cents as number) ?? 0;
      if (r.status === "approved") sumApproved += (r.total_cents as number) ?? 0;
      aggCount += 1;
    }
    if (batch.length < BATCH) break;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading title={t("list.title")} description={t("list.description")} />
        <Button href="/dashboard/quotes/new">
          <PlusIcon className="h-4 w-4" /> {t("list.newQuote")}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FilterPills
          basePath="/dashboard/quotes"
          param="status"
          options={statuses.map((s) => ({
            value: s,
            label: s === "all" ? t("list.filterAll") : t(`status.${s}`),
          }))}
          current={valid}
          preserve={{ q: q || undefined, period: period !== "all" ? period : undefined }}
        />
        <FilterSearch
          id="quote-search"
          label={t("list.searchLabel")}
          defaultValue={q}
          placeholder={t("list.searchPlaceholder")}
          preserve={{ status: valid !== "all" ? valid : undefined, period: period !== "all" ? period : undefined }}
        />
      </div>

      <FilterPills
        basePath="/dashboard/quotes"
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
            { label: t("list.summary.approved"), value: formatCents(sumApproved) },
            { label: t("list.summary.count"), value: String(aggCount) },
          ]}
        />
      )}

      {(quotes ?? []).length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title={filtering ? t("list.emptyFilteredTitle") : t("list.emptyTitle")}
              description={
                filtering
                  ? t("list.emptyFilteredDescription")
                  : t("list.emptyDescription")
              }
              action={filtering ? undefined : <Button href="/dashboard/quotes/new">{t("list.newQuote")}</Button>}
              icon={<QuoteIcon className="h-10 w-10" />}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {(quotes ?? []).map((q) => (
                <li key={q.id}>
                  <Link href={`/dashboard/quotes/${q.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {q.quote_number} · {one(q.customers)?.name}
                      </p>
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                        {q.valid_until ? t("list.validUntil", { date: formatDate(q.valid_until) }) : t("list.noExpiry")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCents(q.total_cents)}</span>
                      <TQuoteStatusPill status={q.status as QuoteStatus} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
          {total > PAGE_SIZE && (
            <div className="px-5 pb-4">
              <Pagination
                page={page}
                totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
                total={total}
                pageSize={PAGE_SIZE}
                basePath="/dashboard/quotes"
                searchParams={keep}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
