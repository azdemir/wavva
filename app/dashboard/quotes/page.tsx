import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuoteStatusPill, type QuoteStatus } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { parsePageParam, PAGE_SIZE } from "@/lib/pagination";
import { PlusIcon, QuoteIcon } from "@/components/ui/icons";
import { formatCents, formatDate } from "@/lib/format";
import { one } from "@/lib/relations";
import { FilterPills, FilterSearch } from "@/components/ui/filters";

const statuses = ["all", "draft", "sent", "approved", "declined", "expired"] as const;

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { company } = await requirePermission("quotes.manage");
  const supabase = await createClient();
  const params = await searchParams;
  const status = params.status ?? "all";
  const valid = statuses.includes(status as (typeof statuses)[number]) ? status : "all";
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
  if (q) {
    query =
      customerIds && customerIds.length > 0
        ? query.or(`quote_number.ilike.${like},customer_id.in.(${customerIds.join(",")})`)
        : query.ilike("quote_number", like);
  }

  const { data: quotes, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const total = count ?? 0;
  const filtering = valid !== "all" || q !== "";
  const keep = { status: valid !== "all" ? valid : undefined, q: q || undefined };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading title="Quotes" description="Build, send, and track customer quotes." />
        <Button href="/dashboard/quotes/new">
          <PlusIcon className="h-4 w-4" /> New quote
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FilterPills
          basePath="/dashboard/quotes"
          param="status"
          options={statuses.map((s) => ({ value: s }))}
          current={valid}
          preserve={{ q: q || undefined }}
        />
        <FilterSearch
          id="quote-search"
          label="Search quotes"
          defaultValue={q}
          placeholder="Quote # or customer name…"
          preserve={{ status: valid !== "all" ? valid : undefined }}
        />
      </div>

      {(quotes ?? []).length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title={filtering ? "No quotes match" : "No quotes here"}
              description={
                filtering
                  ? "Try a different search or status."
                  : "Create your first quote — it takes about a minute."
              }
              action={filtering ? undefined : <Button href="/dashboard/quotes/new">New quote</Button>}
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
                        {q.valid_until ? `Valid until ${formatDate(q.valid_until)}` : "No expiry set"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCents(q.total_cents)}</span>
                      <QuoteStatusPill status={q.status as QuoteStatus} />
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
