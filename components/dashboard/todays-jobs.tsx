import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dayBoundsUtc } from "@/lib/dates";
import { formatTime } from "@/lib/format";
import { one } from "@/lib/relations";
import { statusLabel } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarIcon } from "@/components/ui/icons";

// Same colorful visit pills as the week schedule view (matches marketing).
const todayPillStyles: Record<string, string> = {
  scheduled: "bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400",
  in_progress: "bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400",
  completed: "bg-accent-600 hover:bg-accent-700 dark:bg-accent-500 dark:hover:bg-accent-400",
};

/** Today's schedule widget — streams in independently via Suspense. */
export async function TodaysJobs() {
  const { company } = await requireCompany();
  const t = await getTranslations("dashboard");
  const supabase = await createClient();
  const tz = company.timezone || "America/New_York";
  const { start, end } = dayBoundsUtc(tz);

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, scheduled_start, scheduled_end, status, customers(name), service_addresses(address_line1, city)",
    )
    .eq("company_id", company.id)
    .gte("scheduled_start", start.toISOString())
    .lt("scheduled_start", end.toISOString())
    .neq("status", "canceled")
    .order("scheduled_start", { ascending: true });

  const todaysJobs = jobs ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("schedule.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {todaysJobs.length === 0 ? (
          <EmptyState
            title={t("schedule.empty.title")}
            description={t("schedule.empty.description")}
            action={<Button href="/dashboard/bookings/new">{t("actions.newBooking")}</Button>}
            icon={<CalendarIcon className="h-10 w-10" />}
          />
        ) : (
          <div className="space-y-2">
            {todaysJobs.map((job) => {
              const customerName = one(job.customers)?.name ?? t("quotes.unknownCustomer");
              const addr = one(job.service_addresses);
              return (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  title={`${formatTime(job.scheduled_start, tz)} – ${formatTime(job.scheduled_end, tz)} · ${customerName}${addr ? ` · ${addr.address_line1}, ${addr.city}` : ""} · ${statusLabel(job.status)}`}
                  className={`block truncate rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors ${todayPillStyles[job.status] ?? todayPillStyles.scheduled}`}
                >
                  {formatTime(job.scheduled_start, tz)} · {addr?.address_line1 || customerName}
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Skeleton matching the today's-jobs card. */
export function TodaysJobsSkeleton() {
  return (
    <div
      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-3 animate-pulse"
      aria-hidden="true"
    >
      <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-9 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-9 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-9 w-5/6 rounded-lg bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}
