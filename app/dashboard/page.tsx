import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dayBoundsUtc } from "@/lib/dates";
import { formatCents, formatDate, formatTime } from "@/lib/format";
import { one } from "@/lib/relations";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type QuoteStatus, statusLabel } from "@/components/ui/badge";
import { TQuoteStatusPill } from "@/components/ui/translated-status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon, CalendarIcon, QuoteIcon, UsersIcon, CardIcon } from "@/components/ui/icons";

export default async function DashboardPage() {
  const { membership, company } = await requireCompany();
  // Cleaners work from My jobs — the stats dashboard is staff-only.
  if (membership.role === "cleaner") redirect("/dashboard/my-jobs");
  const t = await getTranslations("dashboard");
  const supabase = await createClient();
  const tz = company.timezone || "America/New_York";
  const { start, end } = dayBoundsUtc(tz);

  const [{ data: jobs }, { data: quotes }, { data: stats }] =
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
      // Single DB round trip for the stat cards (aggregates server-side).
      supabase.rpc("dashboard_stats", {
        p_company_id: company.id,
        p_day_start: start.toISOString(),
        p_day_end: end.toISOString(),
      }),
    ]);

  const todaysJobs = jobs ?? [];

  // Same colorful visit pills as the week schedule view (matches marketing).
  const todayPillStyles: Record<string, string> = {
    scheduled: "bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400",
    in_progress: "bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400",
    completed: "bg-accent-600 hover:bg-accent-700 dark:bg-accent-500 dark:hover:bg-accent-400",
  };
  const openQuotes = quotes ?? [];
  const stat = (stats as unknown as {
    jobs_today: number;
    open_quotes: number;
    outstanding_cents: number;
    customer_count: number;
  }[] | null)?.[0];

  const statsCards = [
    { key: "jobsToday", label: t("stats.jobsToday"), value: String(stat?.jobs_today ?? todaysJobs.length), icon: CalendarIcon },
    { key: "openQuotes", label: t("stats.openQuotes"), value: String(stat?.open_quotes ?? openQuotes.length), icon: QuoteIcon },
    { key: "outstanding", label: t("stats.outstanding"), value: formatCents(stat?.outstanding_cents ?? 0), icon: CardIcon },
    { key: "customers", label: t("stats.customers"), value: String(stat?.customer_count ?? 0), icon: UsersIcon },
  ];

  const daypartKey = daypart(tz);
  const daypartLabel = {
    morning: t("greeting.morning"),
    afternoon: t("greeting.afternoon"),
    evening: t("greeting.evening"),
  }[daypartKey];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading
          title={t("greeting.title", { part: daypartLabel, company: company.name })}
          description={t("description")}
        />
        <div className="flex gap-2">
          <Button href="/dashboard/quotes/new" variant="outline">
            <PlusIcon className="h-4 w-4" /> {t("actions.newQuote")}
          </Button>
          <Button href="/dashboard/bookings/new">
            <PlusIcon className="h-4 w-4" /> {t("actions.newBooking")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key}>
              <CardContent className="flex items-center gap-4 pt-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 dark:text-brand-400">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 dark:text-slate-100">{s.value}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("quotes.title")}</CardTitle>
              <Link href="/dashboard/quotes" className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400">
                {t("actions.viewAll")}
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {openQuotes.length === 0 ? (
              <EmptyState
                title={t("quotes.empty.title")}
                description={t("quotes.empty.description")}
                action={<Button href="/dashboard/quotes/new">{t("actions.newQuote")}</Button>}
                icon={<QuoteIcon className="h-10 w-10" />}
              />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 dark:divide-slate-800">
                {openQuotes.map((q) => (
                  <li key={q.id}>
                    <Link href={`/dashboard/quotes/${q.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900 dark:bg-slate-900">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900 dark:text-slate-100 dark:text-slate-100">
                          {q.quote_number} · {one(q.customers)?.name}
                        </p>
                        <p className="truncate text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-500">
                          {t("quotes.validUntil", { date: formatDate(q.valid_until) })}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 dark:text-slate-100">{formatCents(q.total_cents)}</p>
                        <TQuoteStatusPill status={q.status as QuoteStatus} />
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

function daypart(timezone: string): "morning" | "afternoon" | "evening" {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone }).format(new Date()),
  );
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
