import Link from "next/link";
import { Suspense } from "react";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { statusLabel } from "@/components/ui/badge";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { CrewFilter } from "@/components/schedule/crew-filter";
import { hasFeature, isPlanId } from "@/lib/plans";
import { formatTime } from "@/lib/format";
import { getTranslations, getLocale } from "next-intl/server";

function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; week?: string; month?: string; crew?: string }>;
}) {
  const { company, membership } = await requirePermission("schedule.view");
  const t = await getTranslations("schedule");
  const locale = await getLocale();
  const plan = isPlanId(company.plan) ? company.plan : "starter";
  if (!hasFeature(plan, "schedule")) {
    return (
      <div className="space-y-6">
        <Heading title={t("heading.title")} description={t("heading.description")} />
        <UpgradePrompt feature="schedule" />
      </div>
    );
  }
  const supabase = await createClient();
  const tz = company.timezone || "America/New_York";

  const sp = await searchParams;
  const view = sp.view === "month" ? "month" : "week";
  const weekOffset = parseInt(sp.week ?? "0", 10) || 0;
  const monthOffset = parseInt(sp.month ?? "0", 10) || 0;
  const crewParam = sp.crew ?? "all";
  const today = new Date();

  // Date range for the query: the shown week, or the 6-week grid of the
  // shown month (starting on the Sunday of the week containing the 1st).
  let rangeStart: Date;
  let rangeEnd: Date;
  let titleLabel: string;
  let shownMonthFirst: Date | null = null;
  if (view === "month") {
    shownMonthFirst = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    rangeStart = weekStart(shownMonthFirst);
    rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + 42);
    titleLabel = new Intl.DateTimeFormat(locale, { timeZone: tz, month: "long", year: "numeric" }).format(shownMonthFirst);
  } else {
    rangeStart = weekStart(today);
    rangeStart.setDate(rangeStart.getDate() + weekOffset * 7);
    rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + 7);
    titleLabel = new Intl.DateTimeFormat(locale, { timeZone: tz, month: "long", year: "numeric" }).format(rangeStart);
  }

  // Jobs and the team roster load in parallel; email lookup uses a Map
  // instead of a linear .find() per job per assignee.
  const [{ data: jobs }, { data: members }] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "id, scheduled_start, scheduled_end, status, assigned_user_ids, customers(name), service_addresses(address_line1, city)",
      )
      .eq("company_id", company.id)
      .gte("scheduled_start", rangeStart.toISOString())
      .lt("scheduled_start", rangeEnd.toISOString())
      .neq("status", "canceled")
      .order("scheduled_start", { ascending: true }),
    supabase
      .from("memberships")
      .select("user_id, email")
      .eq("company_id", company.id),
  ]);
  const emailByUserId = new Map((members ?? []).map((m) => [m.user_id, m.email]));
  const emailOf = (uid: string) => emailByUserId.get(uid) ?? t("unknownMember");
  // Crew filter: only show jobs assigned to the selected member (validated).
  const crew = (members ?? []).some((m) => m.user_id === crewParam) ? crewParam : "all";
  const crewJobs = (jobs ?? []).filter(
    (j) => crew === "all" || ((j.assigned_user_ids ?? []) as string[]).includes(crew),
  );

  const dayKey = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const todayKey = dayKey(today);

  // Href builder: view + offset + crew filter travel together.
  const schedHref = (v: "week" | "month", off: number, c: string) => {
    const p = new URLSearchParams();
    if (v === "month") p.set("view", "month");
    if (v === "week" && off !== 0) p.set("week", String(off));
    if (v === "month" && off !== 0) p.set("month", String(off));
    if (c !== "all") p.set("crew", c);
    const qs = p.toString();
    return qs ? `/dashboard/schedule?${qs}` : "/dashboard/schedule";
  };
  // Week offset of the week containing a date (for day → week-view links).
  const weekOffsetFor = (d: Date) =>
    Math.round((weekStart(d).getTime() - weekStart(today).getTime()) / WEEK_MS);
  // Switching views keeps the user's context: month of the shown week, or
  // the week containing the middle of the shown month.
  const toMonthOffset =
    view === "week"
      ? (rangeStart.getFullYear() - today.getFullYear()) * 12 + (rangeStart.getMonth() - today.getMonth())
      : monthOffset;
  const toWeekOffset =
    view === "month" && shownMonthFirst
      ? weekOffsetFor(new Date(shownMonthFirst.getFullYear(), shownMonthFirst.getMonth(), 15))
      : weekOffset;

  const isCleaner = membership.role === "cleaner";
  const fmtDay = (d: Date) =>
    new Intl.DateTimeFormat(locale, { timeZone: tz, weekday: "short", month: "numeric", day: "numeric" }).format(d);

  // Pill colors mirror the advertised calendar: status drives the color.
  const jobPillStyles: Record<string, string> = {
    scheduled: "bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400",
    in_progress: "bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400",
    completed: "bg-accent-600 hover:bg-accent-700 dark:bg-accent-500 dark:hover:bg-accent-400",
  };
  const pillTitle = (job: NonNullable<typeof jobs>[number]) => {
    const customerName = one(job.customers)?.name ?? t("unknownCustomer");
    const addr = one(job.service_addresses);
    const assigned: string[] = job.assigned_user_ids ?? [];
    return `${formatTime(job.scheduled_start, tz)} · ${customerName}${addr ? ` · ${addr.address_line1}, ${addr.city}` : ""} · ${statusLabel(job.status)}${assigned.length > 0 ? ` · ${assigned.map(emailOf).join(", ")}` : ""}`;
  };
  const pillLabel = (job: NonNullable<typeof jobs>[number]) => {
    const customerName = one(job.customers)?.name ?? t("unknownCustomer");
    const shortLabel = one(job.service_addresses)?.address_line1 || customerName;
    return `${formatTime(job.scheduled_start, tz)} · ${shortLabel}`;
  };
  const visibleJob = (job: NonNullable<typeof jobs>[number]) =>
    !(isCleaner && !((job.assigned_user_ids ?? []) as string[]).includes(membership.user_id));

  // ---- Month grid cells (6 weeks x 7 days) ----
  const monthCells: { date: Date; inMonth: boolean; jobs: NonNullable<typeof jobs> }[] = [];
  let weekdayNames: string[] = [];
  if (view === "month" && shownMonthFirst) {
    const shownMonth = shownMonthFirst.getMonth();
    for (let i = 0; i < 42; i++) {
      const d = new Date(rangeStart);
      d.setDate(d.getDate() + i);
      monthCells.push({ date: d, inMonth: d.getMonth() === shownMonth, jobs: [] });
    }
    weekdayNames = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(rangeStart);
      d.setDate(d.getDate() + i);
      return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d);
    });
  }
  // ---- Week columns ----
  const weekDays: { date: Date; jobs: NonNullable<typeof jobs> }[] = [];
  if (view === "week") {
    for (let i = 0; i < 7; i++) {
      const d = new Date(rangeStart);
      d.setDate(d.getDate() + i);
      weekDays.push({ date: d, jobs: [] });
    }
  }
  const columns = view === "month" ? monthCells : weekDays;
  const byKey = new Map(columns.map((c) => [dayKey(c.date), c]));
  for (const job of crewJobs) {
    const bucket = byKey.get(dayKey(new Date(job.scheduled_start)));
    if (bucket && visibleJob(job)) bucket.jobs.push(job);
  }

  const curOffset = view === "month" ? monthOffset : weekOffset;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading title={t("heading.title")} description={titleLabel} />
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label={t("view.label")}
            className="flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
          >
            <Link
              href={schedHref("week", toWeekOffset, crew)}
              aria-current={view === "week" ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                view === "week"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              }`}
            >
              {t("view.week")}
            </Link>
            <Link
              href={schedHref("month", toMonthOffset, crew)}
              aria-current={view === "month" ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                view === "month"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              }`}
            >
              {t("view.month")}
            </Link>
          </div>
          <Suspense>
            <CrewFilter members={(members ?? []) as { user_id: string; email: string }[]} />
          </Suspense>
          <Button
            href={schedHref(view, curOffset - 1, crew)}
            variant="outline"
            size="sm"
          >
            {t("weekNav.prev")}
          </Button>
          <Button href={schedHref(view, 0, crew)} variant="outline" size="sm">
            {t("weekNav.today")}
          </Button>
          <Button href={schedHref(view, curOffset + 1, crew)} variant="outline" size="sm">
            {t("weekNav.next")}
          </Button>
        </div>
      </div>

      {view === "week" ? (
        <div className="grid gap-4 xl:grid-cols-7 lg:grid-cols-4 md:grid-cols-2">
          {weekDays.map(({ date, jobs: dayJobs }) => {
            const isToday = dayKey(date) === todayKey;
            return (
            <Card key={date.toISOString()} className={isToday ? "ring-2 ring-brand-500 dark:ring-brand-400" : ""}>
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                  <p className={`text-sm font-semibold ${isToday ? "text-brand-700 dark:text-brand-300" : "text-slate-700 dark:text-slate-300"}`}>
                    {fmtDay(date)}
                  </p>
                  {!isCleaner && (
                    <Link
                      href={`/dashboard/bookings/new?date=${dayKey(date)}`}
                      title={t("addBooking")}
                      aria-label={`${t("addBooking")} — ${fmtDay(date)}`}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-lg leading-none text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-brand-400"
                    >
                      +
                    </Link>
                  )}
                </div>
                <div className="space-y-2 p-3">
                  {dayJobs.length === 0 && (
                    <p className="px-1 py-2 text-xs text-slate-400 dark:text-slate-500">{t("noVisits")}</p>
                  )}
                  {dayJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/dashboard/jobs/${job.id}`}
                      title={pillTitle(job)}
                      className={`block truncate rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors ${jobPillStyles[job.status] ?? jobPillStyles.scheduled}`}
                    >
                      {pillLabel(job)}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
              {weekdayNames.map((n) => (
                <div key={n} className="px-1 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {n}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthCells.map(({ date, inMonth, jobs: dayJobs }) => {
                const isToday = dayKey(date) === todayKey;
                const wk = weekOffsetFor(date);
                return (
                  <div
                    key={date.toISOString()}
                    className={`min-h-20 border-b border-slate-100 p-1.5 dark:border-slate-800 sm:min-h-28 sm:p-2 [&:nth-child(7n)]:border-r-0 border-r ${
                      inMonth ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900"
                    } ${isToday ? "ring-2 ring-inset ring-brand-500 dark:ring-brand-400" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        href={schedHref("week", wk, crew)}
                        title={t("view.openWeek")}
                        className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold ${
                          isToday
                            ? "bg-brand-600 text-white"
                            : inMonth
                              ? "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                              : "text-slate-400 dark:text-slate-600"
                        }`}
                      >
                        {date.getDate()}
                      </Link>
                      {!isCleaner && (
                        <Link
                          href={`/dashboard/bookings/new?date=${dayKey(date)}`}
                          title={t("addBooking")}
                          aria-label={`${t("addBooking")} — ${fmtDay(date)}`}
                          className="flex h-5 w-5 items-center justify-center rounded text-sm leading-none text-slate-300 hover:bg-slate-100 hover:text-brand-600 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-brand-400"
                        >
                          +
                        </Link>
                      )}
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayJobs.slice(0, 3).map((job) => (
                        <Link
                          key={job.id}
                          href={`/dashboard/jobs/${job.id}`}
                          title={pillTitle(job)}
                          className={`block truncate rounded px-2 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors ${jobPillStyles[job.status] ?? jobPillStyles.scheduled}`}
                        >
                          {pillLabel(job)}
                        </Link>
                      ))}
                      {dayJobs.length > 3 && (
                        <Link
                          href={schedHref("week", wk, crew)}
                          className="block px-1 text-[11px] font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
                        >
                          {t("month.more", { count: dayJobs.length - 3 })}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
