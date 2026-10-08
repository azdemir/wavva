import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { JobStatusPill, type JobStatus } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTime, formatDate } from "@/lib/format";

export const instant = false;

/**
 * Cleaner-facing view: only jobs assigned to the signed-in user,
 * mobile-first cards with big touch targets.
 */
export default async function MyJobsPage() {
  const { user, company } = await requireCompany();
  const supabase = await createClient();
  const tz = company.timezone || "America/New_York";

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, scheduled_start, scheduled_end, status, customers(name), service_addresses(address_line1, city)",
    )
    .eq("company_id", company.id)
    .contains("assigned_user_ids", [user.id])
    .neq("status", "canceled")
    .order("scheduled_start", { ascending: true })
    .limit(30);

  const upcoming = (jobs ?? []).filter((j) => j.status !== "completed");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Heading title="My jobs" description="Visits assigned to you." />

      {upcoming.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="No jobs assigned"
              description="When your manager assigns you visits, they'll show up here."
            />
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((job) => (
            <li key={job.id}>
              <Link
                href={`/dashboard/jobs/${job.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{one(job.customers)?.name}</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {formatDate(job.scheduled_start)} · {formatTime(job.scheduled_start, tz)} –{" "}
                      {formatTime(job.scheduled_end, tz)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {one(job.service_addresses)?.address_line1}, {one(job.service_addresses)?.city}
                    </p>
                  </div>
                  <span className="shrink-0">
                    <JobStatusPill status={job.status as JobStatus} />
                  </span>
                </div>
                <span className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
                  {job.status === "in_progress" ? "Continue job →" : "Open job →"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
