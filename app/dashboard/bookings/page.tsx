import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {type JobStatus} from "@/components/ui/badge";
import { TJobStatusPill } from "@/components/ui/translated-status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { FilterPills, FilterSearch, ExportButton } from "@/components/ui/filters";
import { parsePageParam, PAGE_SIZE } from "@/lib/pagination";
import { PlusIcon, CalendarIcon } from "@/components/ui/icons";
import { formatTime, formatDate } from "@/lib/format";

type BookingRow = {
  id: string;
  booking_number: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  recurrence: string;
  customers: { name: string } | null;
  service_addresses: { address_line1: string; city: string } | null;
};

async function BookingList({ bookings, tz }: { bookings: BookingRow[]; tz: string }) {
  const t = await getTranslations("bookings");
  const recurrenceLabel = (recurrence: string) =>
    recurrence === "weekly"
      ? t("recurrence.weekly")
      : recurrence === "biweekly"
        ? t("recurrence.biweekly")
        : t("recurrence.monthly");
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {bookings.map((b) => (
        <li key={b.id}>
          <Link href={`/dashboard/bookings/${b.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                {b.booking_number} · {b.customers?.name}
              </p>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                {formatDate(b.scheduled_start)}, {formatTime(b.scheduled_start, tz)} – {formatTime(b.scheduled_end, tz)}
                {" · "}{b.service_addresses?.address_line1}, {b.service_addresses?.city}
                {b.recurrence !== "none" && t("list.repeats", { recurrence: recurrenceLabel(b.recurrence) })}
              </p>
            </div>
            <TJobStatusPill status={b.status as JobStatus} className="shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

const statuses = ["all", "scheduled", "in_progress", "completed", "canceled"] as const;

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; pastPage?: string }>;
}) {
  const { company } = await requirePermission("bookings.manage");
  const t = await getTranslations("bookings");
  const supabase = await createClient();
  const tz = company.timezone || "America/New_York";
  const now = new Date().toISOString();
  const params = await searchParams;
  const status = (statuses as readonly string[]).includes(params.status ?? "")
    ? (params.status as (typeof statuses)[number])
    : "all";
  const q = (params.q ?? "").trim();
  const page = parsePageParam(params.page);
  const pastPage = parsePageParam(params.pastPage);
  const like = `%${q.replace(/[%_]/g, "")}%`;

  // Customer-name search needs customer ids first (cross-table ilike).
  let customerIds: string[] | null = null;
  if (q) {
    const { data: matched } = await supabase
      .from("customers")
      .select("id")
      .eq("company_id", company.id)
      .ilike("name", like);
    customerIds = (matched ?? []).map((m) => m.id as string);
  }

  const select =
    "id, booking_number, scheduled_start, scheduled_end, status, recurrence, customers(name), service_addresses(address_line1, city)";

  // Shared status + search filters for both the upcoming and past queries.
  // Customer-name search resolves to customer ids first (cross-table ilike).
  const baseQuery = () =>
    supabase.from("bookings").select(select, { count: "exact" }).eq("company_id", company.id);
  const applyFilters = (query: ReturnType<typeof baseQuery>) => {
    let q2 = query;
    if (status !== "all") q2 = q2.eq("status", status);
    if (q) {
      q2 =
        customerIds && customerIds.length > 0
          ? q2.or(`booking_number.ilike.${like},customer_id.in.(${customerIds.join(",")})`)
          : q2.ilike("booking_number", like);
    }
    return q2;
  };

  const [{ data: upcoming, count: upcomingCount }, { data: past, count: pastCount }] =
    await Promise.all([
      applyFilters(baseQuery().gte("scheduled_start", now).neq("status", "canceled"))
        .order("scheduled_start", { ascending: true })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
      applyFilters(baseQuery().or(`scheduled_start.lt.${now},status.eq.canceled`))
        .order("scheduled_start", { ascending: false })
        .range((pastPage - 1) * PAGE_SIZE, pastPage * PAGE_SIZE - 1),
    ]);

  const upcomingRows = (upcoming ?? []) as unknown as BookingRow[];
  const pastRows = (past ?? []) as unknown as BookingRow[];
  const upcomingTotal = upcomingCount ?? 0;
  const pastTotal = pastCount ?? 0;
  const hasAny = upcomingTotal + pastTotal > 0;
  const filtering = status !== "all" || q !== "";

  const keep = {
    status: status !== "all" ? status : undefined,
    q: q || undefined,
  };
  const exportQs = new URLSearchParams(
    Object.entries(keep).filter(([, v]) => v !== undefined) as [string, string][],
  ).toString();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading title={t("list.title")} description={t("list.description")} />
        <div className="flex flex-wrap gap-2">
          <ExportButton href={`/api/exports/bookings${exportQs ? `?${exportQs}` : ""}`} />
          <Button href="/dashboard/bookings/new">
            <PlusIcon className="h-4 w-4" /> {t("list.newBooking")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FilterPills
          basePath="/dashboard/bookings"
          param="status"
          options={statuses.map((s) => ({ value: s }))}
          current={status}
          preserve={{ q: q || undefined }}
        />
        <FilterSearch
          id="booking-search"
          label={t("list.searchLabel")}
          defaultValue={q}
          placeholder={t("list.searchPlaceholder")}
          preserve={{ status: status !== "all" ? status : undefined }}
        />
      </div>

      {hasAny ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("list.upcoming", { count: upcomingTotal })}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingRows.length === 0 ? (
                <p className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{t("list.nothingUpcoming")}</p>
              ) : (
                <BookingList bookings={upcomingRows} tz={tz} />
              )}
            </CardContent>
            {upcomingTotal > PAGE_SIZE && (
              <div className="px-5 pb-4">
                <Pagination
                  page={page}
                  totalPages={Math.max(1, Math.ceil(upcomingTotal / PAGE_SIZE))}
                  total={upcomingTotal}
                  pageSize={PAGE_SIZE}
                  basePath="/dashboard/bookings"
                  searchParams={{ ...keep, pastPage: pastPage > 1 ? String(pastPage) : undefined }}
                />
              </div>
            )}
          </Card>
          {pastTotal > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("list.pastCanceled", { count: pastTotal })}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <BookingList bookings={pastRows} tz={tz} />
              </CardContent>
              {pastTotal > PAGE_SIZE && (
                <div className="px-5 pb-4">
                  <Pagination
                    page={pastPage}
                    totalPages={Math.max(1, Math.ceil(pastTotal / PAGE_SIZE))}
                    total={pastTotal}
                    pageSize={PAGE_SIZE}
                    basePath="/dashboard/bookings"
                    pageParam="pastPage"
                    searchParams={{ ...keep, page: page > 1 ? String(page) : undefined }}
                  />
                </div>
              )}
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              title={filtering ? t("list.emptyMatchTitle") : t("list.emptyNoneTitle")}
              description={
                filtering
                  ? t("list.emptyMatchDescription")
                  : t("list.emptyNoneDescription")
              }
              action={filtering ? undefined : <Button href="/dashboard/bookings/new">{t("list.newBooking")}</Button>}
              icon={<CalendarIcon className="h-10 w-10" />}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
