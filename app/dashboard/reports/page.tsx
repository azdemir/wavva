import { requirePermission } from "@/lib/permissions";
import { getLocale, getTranslations } from "next-intl/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { ExportButton } from "@/components/ui/filters";
import { hasFeature, isPlanId } from "@/lib/plans";
import { formatCents } from "@/lib/format";
import {
  getReportData,
  isReportPreset,
  resolveReportRange,
  type ReportPreset,
} from "@/lib/reports";
import { ReportFilters } from "@/components/reports/report-filters";

export const instant = false;

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthLabel(key: string, locale: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale, {
    month: "short",
    year: "numeric",
  });
}

function formatHours(h: number, template: (v: string) => string) {
  const rounded = Math.round(h * 10) / 10;
  return template(String(rounded));
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { company } = await requirePermission("reports.view");
  const t = await getTranslations("reports");
  const tTeam = await getTranslations("team");
  const locale = await getLocale();
  const plan = isPlanId(company.plan) ? company.plan : "essential";

  if (!hasFeature(plan, "reports")) {
    return (
      <div className="space-y-6">
        <Heading title={t("heading.title")} description={t("heading.description")} />
        <UpgradePrompt feature="reports" />
      </div>
    );
  }

  const sp = await searchParams;
  const presetRaw = typeof sp.preset === "string" ? sp.preset : "30d";
  const preset: ReportPreset = isReportPreset(presetRaw) ? presetRaw : "30d";
  const range = resolveReportRange(
    preset,
    typeof sp.from === "string" ? sp.from : undefined,
    typeof sp.to === "string" ? sp.to : undefined,
  );
  const data = await getReportData(company.id, range);

  const exportHref = (type: string) =>
    `/api/exports/reports/${type}?preset=${range.preset}&from=${isoDay(range.from)}&to=${isoDay(range.to)}`;

  const dateFmt = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const rangeLabel = `${dateFmt.format(range.from)} – ${dateFmt.format(range.to)}`;

  const presetKey: Record<ReportPreset, string> = {
    "7d": "preset7d",
    "30d": "preset30d",
    "90d": "preset90d",
    this_month: "presetThisMonth",
    last_month: "presetLastMonth",
    this_year: "presetThisYear",
    custom: "presetCustom",
  };
  const filterLabels = {
    label: t("filters.label"),
    presets: (Object.keys(presetKey) as ReportPreset[]).map((p) => ({
      value: p,
      label: t(`filters.${presetKey[p]}`),
    })),
    from: t("filters.from"),
    to: t("filters.to"),
    apply: t("filters.apply"),
  };

  const maxRevenue = Math.max(1, ...data.revenueByMonth.map((r) => r.cents));
  const totalJobsByStatus =
    data.jobsByStatus.scheduled +
    data.jobsByStatus.in_progress +
    data.jobsByStatus.completed +
    data.jobsByStatus.canceled;
  const completionPct =
    totalJobsByStatus > 0
      ? Math.round((data.jobsByStatus.completed / totalJobsByStatus) * 100)
      : 0;

  const kpis: { label: string; value: string }[] = [
    { label: t("kpis.totalRevenue"), value: formatCents(data.kpis.revenuePaidCents) },
    { label: t("kpis.outstanding"), value: formatCents(data.kpis.outstandingCents) },
    { label: t("kpis.jobsCompleted"), value: String(data.kpis.jobsCompleted) },
    {
      label: t("kpis.hoursWorked"),
      value: formatHours(data.kpis.hoursWorked, (v) => t("jobs.hoursValue", { hours: v })),
    },
    { label: t("kpis.avgInvoice"), value: formatCents(data.kpis.avgInvoiceCents) },
    {
      label: t("kpis.quoteWinRate"),
      value:
        data.kpis.quoteWinRatePct === null
          ? t("kpis.noWinRate")
          : `${data.kpis.quoteWinRatePct}%`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Heading title={t("heading.title")} description={t("heading.description")} />
        <p className="text-sm text-slate-500 dark:text-slate-400">{rangeLabel}</p>
      </div>

      <ReportFilters
        labels={filterLabels}
        currentPreset={range.preset}
        currentFrom={isoDay(range.from)}
        currentTo={isoDay(range.to)}
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">{k.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {k.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Employee hours */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{t("employeeHours.title")}</CardTitle>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t("employeeHours.description")}
              </p>
            </div>
            <ExportButton href={exportHref("employee-hours")} />
          </div>
        </CardHeader>
        <CardContent>
          {data.employeeHours.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("employeeHours.noData")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="py-2 pr-4 font-medium">{t("employeeHours.employee")}</th>
                    <th className="py-2 pr-4 font-medium">{t("employeeHours.role")}</th>
                    <th className="py-2 pr-4 text-right font-medium">{t("employeeHours.jobs")}</th>
                    <th className="py-2 pr-4 text-right font-medium">{t("employeeHours.hours")}</th>
                    <th className="w-40 py-2 font-medium">{t("employeeHours.share")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.employeeHours.map((e) => (
                    <tr key={e.userId}>
                      <td className="max-w-[220px] truncate py-2.5 pr-4 font-medium text-slate-900 dark:text-slate-100">
                        {e.email}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">
                        {tTeam(`roles.${e.role}`)}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-slate-600 dark:text-slate-300">
                        {e.jobsCompleted}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-semibold text-slate-900 dark:text-white">
                        {formatHours(e.hours, (v) => t("jobs.hoursValue", { hours: v }))}
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{ width: `${Math.min(100, e.sharePct)}%` }}
                            />
                          </div>
                          <span className="w-12 text-right text-xs text-slate-500 dark:text-slate-400">
                            {e.sharePct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.unassignedJobs > 0 && (
                    <tr className="text-slate-500 dark:text-slate-400">
                      <td className="py-2.5 pr-4">{t("employeeHours.unassigned")}</td>
                      <td className="py-2.5 pr-4">—</td>
                      <td className="py-2.5 pr-4 text-right">{data.unassignedJobs}</td>
                      <td className="py-2.5 pr-4 text-right">
                        {formatHours(data.unassignedHours, (v) =>
                          t("jobs.hoursValue", { hours: v }),
                        )}
                      </td>
                      <td />
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                    <td className="py-2.5 pr-4" colSpan={2}>
                      {t("employeeHours.total")}
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      {data.employeeHours.reduce((a, e) => a + e.jobsCompleted, 0) +
                        data.unassignedJobs}
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      {formatHours(data.kpis.hoursWorked, (v) =>
                        t("jobs.hoursValue", { hours: v }),
                      )}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{t("revenue.title")}</CardTitle>
            <ExportButton href={exportHref("revenue")} />
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t("revenue.byMonth")}
            </h3>
            {data.revenueByMonth.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("revenue.noData")}</p>
            ) : (
              <div className="space-y-3">
                {data.revenueByMonth.map((r) => {
                  const pct = Math.round((r.cents / maxRevenue) * 100);
                  return (
                    <div key={r.key}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {monthLabel(r.key, locale)}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatCents(r.cents)}
                        </span>
                      </div>
                      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t("revenue.byCustomer")}
              </h3>
              {data.revenueByCustomer.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("revenue.noData")}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.revenueByCustomer.map((r) => (
                    <li
                      key={r.name}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                        {r.name}
                      </span>
                      <span className="ml-4 font-semibold text-slate-900 dark:text-white">
                        {formatCents(r.cents)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t("revenue.byService")}
              </h3>
              {data.revenueByService.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("revenue.noData")}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.revenueByService.map((r) => (
                    <li
                      key={r.service}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                        {r.service}
                      </span>
                      <span className="ml-4 font-semibold text-slate-900 dark:text-white">
                        {formatCents(r.cents)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{t("jobs.title")}</CardTitle>
            <ExportButton href={exportHref("jobs")} />
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              ["scheduled", "in_progress", "completed", "canceled"] as const
            ).map((s) => (
              <div
                key={s}
                className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
              >
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t(`jobs.statuses.${s}`)}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {data.jobsByStatus[s]}
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
            <span>
              {t("jobs.completionRate", { pct: completionPct })}
            </span>
            <span>
              {t("jobs.avgDuration")}:{" "}
              {formatHours(data.avgJobHours, (v) => t("jobs.hoursValue", { hours: v }))}
            </span>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t("jobs.byService")}
            </h3>
            {data.jobsByService.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("noData")}</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.jobsByService.map((r) => (
                  <li
                    key={r.service}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                      {r.service}
                    </span>
                    <span className="ml-4 font-semibold text-slate-900 dark:text-white">
                      {r.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quotes */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{t("quotes.title")}</CardTitle>
            <ExportButton href={exportHref("quotes")} />
          </div>
        </CardHeader>
        <CardContent>
          {data.quotes.sent +
            data.quotes.approved +
            data.quotes.declined +
            data.quotes.expired ===
          0 ? (
            <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("quotes.noData")}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {(
                [
                  ["sent", data.quotes.sent],
                  ["approved", data.quotes.approved],
                  ["declined", data.quotes.declined],
                  ["expired", data.quotes.expired],
                ] as const
              ).map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                >
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t(`quotes.${k}`)}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{v}</p>
                </div>
              ))}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("quotes.winRate")}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {data.kpis.quoteWinRatePct === null
                    ? t("kpis.noWinRate")
                    : `${data.kpis.quoteWinRatePct}%`}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("quotes.quotedValue")}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCents(data.quotes.quotedCents)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
