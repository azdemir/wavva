import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireCompany } from "@/lib/auth";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
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
