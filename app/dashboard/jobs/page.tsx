import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobStatusPill, type JobStatus } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { parsePageParam, PAGE_SIZE } from "@/lib/pagination";
import { ClockIcon } from "@/components/ui/icons";
import { formatTime, formatDate } from "@/lib/format";

export const instant = false;

type JobRow = {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  assigned_user_ids: string[] | null;
  customers: { name: string } | null;
  service_addresses: { address_line1: string; city: string } | null;
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { company, membership } = await requireCompany();
  const supabase = await createClient();
  const tz = company.timezone || "America/New_York";
  const isStaff = membership.role === "owner" || membership.role === "manager";

  const page = parsePageParam((await searchParams).page);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("jobs")
    .select(
      "id, scheduled_start, scheduled_end, status, assigned_user_ids, customers(name), service_addresses(address_line1, city)",
      { count: "exact" },
    )
    .eq("company_id", company.id)
    .order("scheduled_start", { ascending: false })
    .range(from, to);

  // Cleaners only see their own jobs.
  if (!isStaff) {
    query = query.contains("assigned_user_ids", [membership.user_id]);
  }

  const { data, count } = await query;
  const jobs = (data ?? []) as unknown as JobRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <Heading
        title="Jobs"
        description={
          isStaff
            ? "Every visit, who it's assigned to, and its status."
            : "Visits assigned to you."
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>All jobs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<ClockIcon className="h-8 w-8" />}
                title="No jobs yet"
                description="Jobs are created automatically when you add a booking."
                action={
                  isStaff ? (
                    <Link
                      href="/dashboard/bookings/new"
                      className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700"
                    >
                      Create a booking →
                    </Link>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {jobs.map((j) => {
                  const assignedCount = j.assigned_user_ids?.length ?? 0;
                  return (
                    <li key={j.id}>
                      <Link
                        href={`/dashboard/jobs/${j.id}`}
                        className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                            {one(j.customers)?.name ?? "Job"} ·{" "}
                            {formatDate(j.scheduled_start)}
                          </p>
                          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                            {formatTime(j.scheduled_start, tz)} –{" "}
                            {formatTime(j.scheduled_end, tz)}
                            {j.service_addresses &&
                              ` · ${j.service_addresses.address_line1}, ${j.service_addresses.city}`}
                            {isStaff &&
                              ` · ${assignedCount === 0 ? "Unassigned" : `${assignedCount} assigned`}`}
                          </p>
                        </div>
                        <JobStatusPill status={j.status as JobStatus} className="shrink-0" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-slate-100 dark:border-slate-800 p-4">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={count ?? 0}
                  pageSize={PAGE_SIZE}
                  basePath="/dashboard/jobs"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
