import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dayBoundsUtc } from "@/lib/dates";
import { formatCents } from "@/lib/format";
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
    { key: "jobsToday", label: t("stats.jobsToday"), value: String(stat?.jobs_today ?? 0), icon: CalendarIcon, bg: "linear-gradient(160deg,#f1edff,#ffffff)", darkBg: "linear-gradient(160deg,#232046,#0f172a)" },
    { key: "openQuotes", label: t("stats.openQuotes"), value: String(stat?.open_quotes ?? 0), icon: QuoteIcon, bg: "linear-gradient(160deg,#ffeef3,#ffffff)", darkBg: "linear-gradient(160deg,#2e1c2b,#0f172a)" },
    { key: "outstanding", label: t("stats.outstanding"), value: formatCents(stat?.outstanding_cents ?? 0), icon: CardIcon, bg: "linear-gradient(160deg,#e7f8ec,#ffffff)", darkBg: "linear-gradient(160deg,#16281d,#0f172a)" },
    { key: "customers", label: t("stats.customers"), value: String(stat?.customer_count ?? 0), icon: UsersIcon, bg: "linear-gradient(160deg,#e9f2ff,#ffffff)", darkBg: "linear-gradient(160deg,#17273a,#0f172a)" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.key}
            className="rounded-[20px] border border-white/60 bg-[var(--card-bg)] p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-[var(--card-bg-dark)]"
            style={{ "--card-bg": s.bg, "--card-bg-dark": s.darkBg } as CSSProperties}
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sb-violet-dark shadow-sm dark:bg-slate-800">
              <Icon className="h-6 w-6" />
            </span>
            <p className="mt-3 font-sb text-[26px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{s.value}</p>
            <p className="font-sb text-[13px] font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
          </div>
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
