import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobStatusPill, type JobStatus } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
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

function BookingList({ bookings, tz }: { bookings: BookingRow[]; tz: string }) {
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
                {b.recurrence !== "none" && ` · repeats ${b.recurrence}`}
              </p>
            </div>
            <JobStatusPill status={b.status as JobStatus} className="shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pastPage?: string }>;
}) {
  const { company } = await requireCompany();
  const supabase = await createClient();
  const tz = company.timezone || "America/New_York";
  const now = new Date().toISOString();
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const pastPage = parsePageParam(params.pastPage);

  const select =
    "id, booking_number, scheduled_start, scheduled_end, status, recurrence, customers(name), service_addresses(address_line1, city)";

  const [{ data: upcoming, count: upcomingCount }, { data: past, count: pastCount }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select(select, { count: "exact" })
        .eq("company_id", company.id)
        .gte("scheduled_start", now)
        .neq("status", "canceled")
        .order("scheduled_start", { ascending: true })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
      supabase
        .from("bookings")
        .select(select, { count: "exact" })
        .eq("company_id", company.id)
        .or(`scheduled_start.lt.${now},status.eq.canceled`)
        .order("scheduled_start", { ascending: false })
        .range((pastPage - 1) * PAGE_SIZE, pastPage * PAGE_SIZE - 1),
    ]);

  const upcomingRows = (upcoming ?? []) as unknown as BookingRow[];
  const pastRows = (past ?? []) as unknown as BookingRow[];
  const upcomingTotal = upcomingCount ?? 0;
  const pastTotal = pastCount ?? 0;
  const hasAny = upcomingTotal + pastTotal > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading title="Bookings" description="Scheduled cleanings and their visits." />
        <Button href="/dashboard/bookings/new">
          <PlusIcon className="h-4 w-4" /> New booking
        </Button>
      </div>

      {hasAny ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming ({upcomingTotal})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingRows.length === 0 ? (
                <p className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Nothing upcoming.</p>
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
                  searchParams={{ pastPage: pastPage > 1 ? String(pastPage) : undefined }}
                />
              </div>
            )}
          </Card>
          {pastTotal > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Past & canceled ({pastTotal})</CardTitle>
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
                    searchParams={{ page: page > 1 ? String(page) : undefined }}
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
              title="No bookings yet"
              description="Book a cleaning and its job visits will be generated automatically."
              action={<Button href="/dashboard/bookings/new">New booking</Button>}
              icon={<CalendarIcon className="h-10 w-10" />}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
