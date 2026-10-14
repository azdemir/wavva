import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireCompany } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PlusIcon, PhoneIcon } from "@/components/ui/icons";
import { StatsCards, StatsCardsSkeleton } from "@/components/dashboard/stats-cards";
import { TodaysJobs, TodaysJobsSkeleton } from "@/components/dashboard/todays-jobs";
import { OpenQuotes, OpenQuotesSkeleton } from "@/components/dashboard/open-quotes";

/**
 * Dashboard home — the shell (greeting + actions) renders immediately;
 * each data widget streams in independently via Suspense so a slow query
 * never blocks the whole page.
 */
export default async function DashboardPage() {
  const { membership, company } = await requireCompany();
  // Cleaners work from My jobs — the stats dashboard is staff-only.
  if (membership.role === "cleaner") redirect("/dashboard/my-jobs");
  const t = await getTranslations("dashboard");

  const tz = company.timezone || "America/New_York";
  const daypartKey = daypart(tz);
  const daypartLabel = {
    morning: t("greeting.morning"),
    afternoon: t("greeting.afternoon"),
    evening: t("greeting.evening"),
  }[daypartKey];

  return (
    <div className="space-y-8">
      {/* Mission control hero */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-sb-lav via-sb-pink to-sb-blue p-7 md:p-9 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:border dark:border-slate-800">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sb-violet/20 blur-[60px]"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="font-sb text-xs font-bold uppercase tracking-[0.18em] text-sb-violet-dark">
              ✦ Mission control
            </p>
            <h1 className="mt-2 font-sb text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t("greeting.title", { part: daypartLabel, company: company.name })}
            </h1>
            <p className="mt-1.5 font-sb text-[15px] text-slate-600 dark:text-slate-400">
              {t("description")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button href="/dashboard/front-office" variant="primary">
              <PhoneIcon className="h-4 w-4" /> Front office
            </Button>
            <Button href="/dashboard/bookings/new" variant="outline">
              <PlusIcon className="h-4 w-4" /> {t("actions.newBooking")}
            </Button>
          </div>
        </div>
      </div>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<TodaysJobsSkeleton />}>
          <TodaysJobs />
        </Suspense>
        <Suspense fallback={<OpenQuotesSkeleton />}>
          <OpenQuotes />
        </Suspense>
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
