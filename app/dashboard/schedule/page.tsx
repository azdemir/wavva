import Link from "next/link";
import { Suspense } from "react";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {type JobStatus} from "@/components/ui/badge";
import { TJobStatusPill } from "@/components/ui/translated-status-pill";
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
        {days.map(({ date, jobs: dayJobs }) => (
          <Card key={date.toISOString()}>
            <CardContent className="p-0">
              <p className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {fmtDay(date)}
              </p>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {dayJobs.length === 0 && (
                  <li className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">{t("noVisits")}</li>
                )}
                {dayJobs.map((job) => {
                  const assigned: string[] = job.assigned_user_ids ?? [];
                  if (isCleaner && !assigned.includes(membership.user_id)) return null;
                  return (
                    <li key={job.id}>
                      <Link href={`/dashboard/jobs/${job.id}`} className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatTime(job.scheduled_start, tz)} · {one(job.customers)?.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
                          {one(job.service_addresses)?.address_line1}, {one(job.service_addresses)?.city}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <TJobStatusPill status={job.status as JobStatus} />
                          {assigned.slice(0, 2).map((uid) => (
                            <span key={uid} className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-500">
                              {emailOf(uid).split("@")[0]}
                            </span>
                          ))}
                          {assigned.length > 2 && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-500">+{assigned.length - 2}</span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
