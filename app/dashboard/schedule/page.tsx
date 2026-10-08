import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobStatusPill, type JobStatus } from "@/components/ui/badge";
import { formatTime } from "@/lib/format";

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
  searchParams: Promise<{ week?: string }>;
}) {
  const { company, membership } = await requireCompany();
  const supabase = await createClient();
  const tz = company.timezone || "America/New_York";

  const offset = parseInt((await searchParams).week ?? "0", 10) || 0;
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
  const emailOf = (uid: string) => emailByUserId.get(uid) ?? "Unknown";

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
  for (const job of jobs ?? []) {
    const bucket = byKey.get(dayKey(new Date(job.scheduled_start)));
    bucket?.jobs.push(job);
  }

  const isCleaner = membership.role === "cleaner";
  const fmtDay = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "numeric", day: "numeric" }).format(d);
  const monthLabel = new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "long", year: "numeric" }).format(start);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading title="Schedule" description={monthLabel} />
        <div className="flex gap-2">
          <Button
            href={offset <= 0 ? "/dashboard/schedule" : `/dashboard/schedule?week=${offset - 1}`}
            variant="outline"
            size="sm"
          >
            ← Prev
          </Button>
          <Button href="/dashboard/schedule" variant="outline" size="sm">
            Today
          </Button>
          <Button href={`/dashboard/schedule?week=${offset + 1}`} variant="outline" size="sm">
            Next →
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
                  <li className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">No visits</li>
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
                          <JobStatusPill status={job.status as JobStatus} />
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
