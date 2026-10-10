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
import { getTranslations } from "next-intl/server";

function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; crew?: string }>;
}) {
  const { company, membership } = await requirePermission("schedule.view");
  const t = await getTranslations("schedule");
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

  const offset = parseInt((await searchParams).week ?? "0", 10) || 0;
  const crewParam = (await searchParams).crew ?? "all";
  const start = weekStart(new Date());
  start.setDate(start.getDate() + offset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  // Jobs and the team roster load in parallel; email lookup uses a Map
  // instead of a linear .find() per job per assignee.
  const [{ data: jobs }, { data: members }] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "id, scheduled_start, scheduled_end, status, assigned_user_ids, customers(name), service_addresses(address_line1, city)",
      )
      .eq("company_id", company.id)
      .gte("scheduled_start", start.toISOString())
      .lt("scheduled_start", end.toISOString())
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

  // Group by local day.
  const days: { date: Date; jobs: NonNullable<typeof jobs> }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push({ date: d, jobs: [] });
  }
  const dayKey = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const byKey = new Map(days.map((d) => [dayKey(d.date), d]));
  for (const job of crewJobs) {
    const bucket = byKey.get(dayKey(new Date(job.scheduled_start)));
    bucket?.jobs.push(job);
  }

  const isCleaner = membership.role === "cleaner";
  // Week links preserve the crew filter.
  const weekHref = (w: number) => {
    const sp = new URLSearchParams();
    if (w !== 0) sp.set("week", String(w));
    if (crew !== "all") sp.set("crew", crew);
    const qs = sp.toString();
    return qs ? `/dashboard/schedule?${qs}` : "/dashboard/schedule";
  };
  const fmtDay = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "numeric", day: "numeric" }).format(d);
  const monthLabel = new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "long", year: "numeric" }).format(start);
  const todayKey = dayKey(new Date());

  // Pill colors mirror the advertised week view: status drives the color.
  const jobPillStyles: Record<string, string> = {
    scheduled: "bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400",
    in_progress: "bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400",
    completed: "bg-accent-600 hover:bg-accent-700 dark:bg-accent-500 dark:hover:bg-accent-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading title={t("heading.title")} description={monthLabel} />
        <div className="flex flex-wrap items-center gap-2">
          <Suspense>
            <CrewFilter members={(members ?? []) as { user_id: string; email: string }[]} />
          </Suspense>
          <Button
            href={weekHref(offset - 1)}
            variant="outline"
            size="sm"
          >
            {t("weekNav.prev")}
          </Button>
          <Button href={weekHref(0)} variant="outline" size="sm">
            {t("weekNav.today")}
          </Button>
          <Button href={weekHref(offset + 1)} variant="outline" size="sm">
            {t("weekNav.next")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-7 lg:grid-cols-4 md:grid-cols-2">
        {days.map(({ date, jobs: dayJobs }) => {
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
                {dayJobs.map((job) => {
                  const assigned: string[] = job.assigned_user_ids ?? [];
                  if (isCleaner && !assigned.includes(membership.user_id)) return null;
                  const customerName = one(job.customers)?.name ?? t("unknownCustomer");
                  const addr = one(job.service_addresses);
                  const shortLabel = addr?.address_line1 || customerName;
                  const time = formatTime(job.scheduled_start, tz);
                  return (
                    <Link
                      key={job.id}
                      href={`/dashboard/jobs/${job.id}`}
                      title={`${time} · ${customerName}${addr ? ` · ${addr.address_line1}, ${addr.city}` : ""} · ${statusLabel(job.status)}${assigned.length > 0 ? ` · ${assigned.map(emailOf).join(", ")}` : ""}`}
                      className={`block truncate rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors ${jobPillStyles[job.status] ?? jobPillStyles.scheduled}`}
                    >
                      {time} · {shortLabel}
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
