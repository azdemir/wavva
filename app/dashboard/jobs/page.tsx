import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {type JobStatus} from "@/components/ui/badge";
import { TJobStatusPill } from "@/components/ui/translated-status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { parsePageParam, PAGE_SIZE } from "@/lib/pagination";
import { ClockIcon } from "@/components/ui/icons";
import { formatTime, formatDate } from "@/lib/format";
import { FilterPills, FilterSearch } from "@/components/ui/filters";
import { getTranslations } from "next-intl/server";

export const instant = false;

const statuses = ["all", "scheduled", "in_progress", "completed", "canceled"] as const;
const statusKey: Record<(typeof statuses)[number], string> = {
  all: "all",
  scheduled: "scheduled",
  in_progress: "inProgress",
  completed: "completed",
  canceled: "canceled",
};

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
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { company, membership } = await requirePermission("jobs.manage");
  const supabase = await createClient();
  const t = await getTranslations("jobs");
  const tz = company.timezone || "America/New_York";
  const isStaff = membership.role === "owner" || membership.role === "manager";

  const params = await searchParams;
  const status = (statuses as readonly string[]).includes(params.status ?? "")
    ? (params.status as (typeof statuses)[number])
    : "all";
  const q = (params.q ?? "").trim();
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const page = parsePageParam(params.page);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let customerIds: string[] | null = null;
  if (q) {
    const { data: matched } = await supabase
      .from("customers")
      .select("id")
      .eq("company_id", company.id)
      .ilike("name", like);
    customerIds = (matched ?? []).map((m) => m.id as string);
  }

  let query = supabase
    .from("jobs")
    .select(
      "id, scheduled_start, scheduled_end, status, assigned_user_ids, customers(name), service_addresses(address_line1, city)",
      { count: "exact" },
    )
    .eq("company_id", company.id)
    .order("scheduled_start", { ascending: false })
    .range(from, to);

  if (status !== "all") query = query.eq("status", status);
  if (q) {
    query =
      customerIds && customerIds.length > 0
        ? query.in("customer_id", customerIds)
        : query.eq("customer_id", "00000000-0000-0000-0000-000000000000"); // no match
  }

  // Cleaners only see their own jobs.
  if (!isStaff) {
    query = query.contains("assigned_user_ids", [membership.user_id]);
  }

  const { data, count } = await query;
  const jobs = (data ?? []) as unknown as JobRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const filtering = status !== "all" || q !== "";
  const keep = { status: status !== "all" ? status : undefined, q: q || undefined };

  return (
    <div className="space-y-6">
      <Heading
        title={t("list.title")}
        description={
          isStaff ? t("list.descriptionStaff") : t("list.descriptionCleaner")
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FilterPills
          basePath="/dashboard/jobs"
          param="status"
          options={statuses.map((s) => ({ value: s, label: t(`status.${statusKey[s]}`) }))}
          current={status}
          preserve={{ q: q || undefined }}
        />
        <FilterSearch
          id="job-search"
          label={t("list.searchLabel")}
          defaultValue={q}
          placeholder={t("list.searchPlaceholder")}
          preserve={{ status: status !== "all" ? status : undefined }}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("list.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<ClockIcon className="h-8 w-8" />}
                title={filtering ? t("list.emptyTitleFiltered") : t("list.emptyTitle")}
                description={
                  filtering ? t("list.emptyDescFiltered") : t("list.emptyDesc")
                }
                action={
                  isStaff ? (
                    <Link
                      href="/dashboard/bookings/new"
                      className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700"
                    >
                      {t("list.emptyCta")}
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
                            {one(j.customers)?.name ?? t("list.fallbackName")} ·{" "}
                            {formatDate(j.scheduled_start)}
                          </p>
                          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                            {formatTime(j.scheduled_start, tz)} –{" "}
                            {formatTime(j.scheduled_end, tz)}
                            {j.service_addresses &&
                              ` · ${j.service_addresses.address_line1}, ${j.service_addresses.city}`}
                            {isStaff &&
                              ` · ${assignedCount === 0 ? t("list.unassigned") : t("list.assignedCount", { count: assignedCount })}`}
                          </p>
                        </div>
                        <TJobStatusPill status={j.status as JobStatus} className="shrink-0" />
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
                  searchParams={keep}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
