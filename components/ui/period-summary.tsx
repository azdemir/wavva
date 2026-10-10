import { Card, CardContent } from "@/components/ui/card";

export type SummaryStat = { label: string; value: string; sub?: string };

/**
 * Row of summary stat cards shown above the quotes/invoices lists,
 * e.g. totals for the selected period (today / this week / this month).
 */
export function PeriodSummary({
  title,
  stats,
}: {
  title: string;
  stats: SummaryStat[];
}) {
  return (
    <section aria-label={title} className="space-y-2">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="px-4 py-3.5">
              <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                {s.label}
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {s.value}
              </p>
              {s.sub && (
                <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
                  {s.sub}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
