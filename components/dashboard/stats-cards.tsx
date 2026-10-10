import { getTranslations } from "next-intl/server";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dayBoundsUtc } from "@/lib/dates";
import { formatCents } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, QuoteIcon, UsersIcon, CardIcon } from "@/components/ui/icons";

/**
 * Dashboard stat cards — streams in independently via Suspense.
 * Aggregates server-side through the dashboard_stats() RPC (single round trip).
 */
export async function StatsCards() {
  const { company } = await requireCompany();
  const t = await getTranslations("dashboard");
  const supabase = await createClient();
  const tz = company.timezone || "America/New_York";
  const { start, end } = dayBoundsUtc(tz);

  const { data: stats } = await supabase.rpc("dashboard_stats", {
    p_company_id: company.id,
    p_day_start: start.toISOString(),
    p_day_end: end.toISOString(),
  });

  const stat = (
    stats as unknown as {
      jobs_today: number;
      open_quotes: number;
      outstanding_cents: number;
      customer_count: number;
    }[] | null
  )?.[0];

  const cards = [
    { key: "jobsToday", label: t("stats.jobsToday"), value: String(stat?.jobs_today ?? 0), icon: CalendarIcon },
    { key: "openQuotes", label: t("stats.openQuotes"), value: String(stat?.open_quotes ?? 0), icon: QuoteIcon },
    { key: "outstanding", label: t("stats.outstanding"), value: formatCents(stat?.outstanding_cents ?? 0), icon: CardIcon },
    { key: "customers", label: t("stats.customers"), value: String(stat?.customer_count ?? 0), icon: UsersIcon },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.key}>
            <CardContent className="flex items-center gap-4 pt-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/** Skeleton matching the stat cards grid. */
export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 animate-pulse" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6"
        >
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-2">
              <div className="h-6 w-16 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
