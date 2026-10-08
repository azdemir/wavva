import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuoteStatusPill, statusLabel, type QuoteStatus } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon, QuoteIcon } from "@/components/ui/icons";
import { formatCents, formatDate } from "@/lib/format";
import { one } from "@/lib/relations";

const statuses = ["all", "draft", "sent", "approved", "declined", "expired"] as const;

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { company } = await requireCompany();
  const supabase = await createClient();
  const status = (await searchParams).status ?? "all";
  const valid = statuses.includes(status as (typeof statuses)[number]) ? status : "all";

  let query = supabase
    .from("quotes")
    .select("id, quote_number, status, total_cents, valid_until, created_at, customers(name)")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });
  if (valid !== "all") query = query.eq("status", valid);

  const { data: quotes } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading title="Quotes" description="Build, send, and track customer quotes." />
        <Button href="/dashboard/quotes/new">
          <PlusIcon className="h-4 w-4" /> New quote
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/dashboard/quotes" : `/dashboard/quotes?status=${s}`}
            className={`inline-flex min-h-9 items-center rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${
              valid === s ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {statusLabel(s)}
          </Link>
        ))}
      </div>

      {(quotes ?? []).length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="No quotes here"
              description="Create your first quote — it takes about a minute."
              action={<Button href="/dashboard/quotes/new">New quote</Button>}
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
        </Card>
      )}
    </div>
  );
}
