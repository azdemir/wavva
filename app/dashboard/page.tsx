import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dayBoundsUtc } from "@/lib/dates";
import { formatCents, formatDate, formatTime } from "@/lib/format";
import { one } from "@/lib/relations";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  JobStatusPill,
  QuoteStatusPill,
  type JobStatus,
  type QuoteStatus,
} from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon, CalendarIcon, QuoteIcon, UsersIcon, CardIcon } from "@/components/ui/icons";

export default async function DashboardPage() {
  const { company } = await requireCompany();
  const supabase = await createClient();
  const tz = company.timezone || "America/New_York";
  const { start, end } = dayBoundsUtc(tz);

  const [{ data: jobs }, { data: quotes }, { data: invoices }, { count: customerCount }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select(
          "id, scheduled_start, scheduled_end, status, customers(name), service_addresses(address_line1, city)",
        )
        .gte("scheduled_start", start.toISOString())
        .lt("scheduled_start", end.toISOString())
        .neq("status", "canceled")
        .order("scheduled_start", { ascending: true }),
      supabase
        .from("quotes")
        .select("id, quote_number, status, total_cents, valid_until, customers(name)")
        .in("status", ["draft", "sent"])
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("invoices")
        .select("total_cents, amount_paid_cents")
        .in("status", ["sent", "overdue"]),
      supabase.from("customers").select("id", { count: "exact", head: true }),
    ]);

  const todaysJobs = jobs ?? [];
  const openQuotes = quotes ?? [];
  const outstanding = (invoices ?? []).reduce(
    (sum, inv) => sum + (inv.total_cents - inv.amount_paid_cents),
    0,
  );

  const stats = [
    { label: "Jobs today", value: String(todaysJobs.length), icon: CalendarIcon },
    { label: "Open quotes", value: String(openQuotes.length), icon: QuoteIcon },
    { label: "Outstanding", value: formatCents(outstanding), icon: CardIcon },
    { label: "Customers", value: String(customerCount ?? 0), icon: UsersIcon },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading
          title={`Good ${daypart(tz)}, ${company.name}`}
          description="Here's what's happening in your business today."
        />
        <div className="flex gap-2">
          <Button href="/dashboard/quotes/new" variant="outline">
            <PlusIcon className="h-4 w-4" /> New quote
          </Button>
          <Button href="/dashboard/bookings/new">
            <PlusIcon className="h-4 w-4" /> New booking
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-sm text-slate-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {todaysJobs.length === 0 ? (
              <EmptyState
                title="Nothing scheduled today"
                description="Create a booking and its jobs will appear here."
                action={<Button href="/dashboard/bookings/new">New booking</Button>}
                icon={<CalendarIcon className="h-10 w-10" />}
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {todaysJobs.map((job) => (
                  <li key={job.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {one(job.customers)?.name ?? "Customer"}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {formatTime(job.scheduled_start, tz)} – {formatTime(job.scheduled_end, tz)}
                        {" · "}
                        {one(job.service_addresses)?.address_line1}
                      </p>
                    </div>
                    <JobStatusPill status={job.status as JobStatus} className="shrink-0" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Open quotes</CardTitle>
              <Link href="/dashboard/quotes" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {openQuotes.length === 0 ? (
              <EmptyState
                title="No open quotes"
                description="Build a quote in under a minute and send it to a customer."
                action={<Button href="/dashboard/quotes/new">New quote</Button>}
                icon={<QuoteIcon className="h-10 w-10" />}
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {openQuotes.map((q) => (
                  <li key={q.id}>
                    <Link href={`/dashboard/quotes/${q.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {q.quote_number} · {one(q.customers)?.name}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          Valid until {formatDate(q.valid_until)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-slate-900">{formatCents(q.total_cents)}</p>
                        <QuoteStatusPill status={q.status as QuoteStatus} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function daypart(timezone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone }).format(new Date()),
  );
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
