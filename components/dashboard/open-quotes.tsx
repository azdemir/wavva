import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCents, formatDate } from "@/lib/format";
import { one } from "@/lib/relations";
import { type QuoteStatus } from "@/components/ui/badge";
import { TQuoteStatusPill } from "@/components/ui/translated-status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { QuoteIcon } from "@/components/ui/icons";

/** Open quotes widget — streams in independently via Suspense. */
export async function OpenQuotes() {
  const { company } = await requireCompany();
  const t = await getTranslations("dashboard");
  const supabase = await createClient();

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, quote_number, status, total_cents, valid_until, customers(name)")
    .eq("company_id", company.id)
    .in("status", ["draft", "sent"])
    .order("created_at", { ascending: false })
    .limit(5);

  const openQuotes = quotes ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("quotes.title")}</CardTitle>
          <Link
            href="/dashboard/quotes"
            className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700"
          >
            {t("actions.viewAll")}
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {openQuotes.length === 0 ? (
          <EmptyState
            title={t("quotes.empty.title")}
            description={t("quotes.empty.description")}
            action={<Button href="/dashboard/quotes/new">{t("actions.newQuote")}</Button>}
            icon={<QuoteIcon className="h-10 w-10" />}
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {openQuotes.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/dashboard/quotes/${q.id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {q.quote_number} · {one(q.customers)?.name}
                    </p>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                      {t("quotes.validUntil", { date: formatDate(q.valid_until) })}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCents(q.total_cents)}
                    </p>
                    <TQuoteStatusPill status={q.status as QuoteStatus} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Skeleton matching the open-quotes card. */
export function OpenQuotesSkeleton() {
  return (
    <div
      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-3 animate-pulse"
      aria-hidden="true"
    >
      <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-12 w-full rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-12 w-full rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-12 w-5/6 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}
