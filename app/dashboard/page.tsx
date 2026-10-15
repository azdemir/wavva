import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLANS, isPlanId } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneIcon, SparkleIcon } from "@/components/ui/icons";
import { EscalationQueue } from "@/components/dashboard/front-office/escalation-queue";
import type { EscalationView } from "@/lib/actions/front-office";
import { formatDateTime } from "@/lib/format";

/**
 * Dashboard home — Wavva mission control.
 * The shell (greeting + actions) renders immediately; each data widget
 * streams in independently via Suspense so a slow query never blocks
 * the whole page. All reads are manager-safe (scoped by company_id).
 */
export default async function DashboardPage() {
  const { membership, company } = await requireCompany();
  // The Wavva workspace is staff-only (no cleaner role surface).
  if (membership.role === "cleaner") redirect("/dashboard/front-office");
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
              <PhoneIcon className="h-4 w-4" /> {t("overview.viewCalls")}
            </Button>
            <Button href="/dashboard/front-office/ai-answering" variant="outline">
              <SparkleIcon className="h-4 w-4" /> {t("overview.aiSettings")}
            </Button>
          </div>
        </div>
      </div>

      <Suspense fallback={<OverviewStatsSkeleton />}>
        <OverviewStats />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<QueueSkeleton />}>
          <NeedsYourOk />
        </Suspense>
        <Suspense fallback={<QueueSkeleton />}>
          <RecentCalls />
        </Suspense>
      </div>
    </div>
  );
}

/** Stat cards: calls answered, minutes used, escalations, enquiries. */
async function OverviewStats() {
  const { company } = await requireCompany();
  const t = await getTranslations("dashboard");
  const supabase = await createClient();

  const plan = isPlanId(company.plan) ? company.plan : "essential";
  const minutesIncluded = PLANS[plan].minutesIncluded;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [{ data: calls }, { count: pending }, { count: enquiries }] =
    await Promise.all([
      supabase
        .from("front_office_ai_calls")
        .select("duration_seconds")
        .eq("company_id", company.id)
        .gte("started_at", monthStart.toISOString()),
      supabase
        .from("front_office_escalations")
        .select("id", { count: "exact", head: true })
        .eq("company_id", company.id)
        .eq("status", "pending"),
      supabase
        .from("front_office_conversations")
        .select("id", { count: "exact", head: true })
        .eq("company_id", company.id)
        .eq("direction", "in")
        .gte("created_at", weekAgo.toISOString()),
    ]);

  const minutesUsed = Math.round(
    (calls ?? []).reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / 60,
  );
  const callsMonth = calls?.length ?? 0;

  const cards = [
    {
      key: "calls",
      label: t("overview.callsAnswered"),
      value: String(callsMonth),
      hint: t("overview.callsAnsweredHint"),
    },
    {
      key: "minutes",
      label: t("overview.minutesUsed"),
      value: `${minutesUsed}`,
      hint: t("overview.minutesUsedHint", { used: minutesUsed, included: minutesIncluded }),
    },
    {
      key: "escalations",
      label: t("overview.needsOk"),
      value: String(pending ?? 0),
      hint: t("overview.needsOkHint"),
    },
    {
      key: "enquiries",
      label: t("overview.enquiries"),
      value: String(enquiries ?? 0),
      hint: t("overview.enquiriesHint"),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((s) => (
        <Card key={s.key}>
          <CardContent>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function OverviewStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent>
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Escalations awaiting a decision. */
async function NeedsYourOk() {
  const { company } = await requireCompany();
  const t = await getTranslations("dashboard");
  const supabase = await createClient();

  const { data } = await supabase
    .from("front_office_escalations")
    .select("id, kind, title, detail, payload, status, created_at, resolved_at")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false })
    .limit(10);
  const rows = ((data ?? []) as EscalationView[]).sort((a, b) =>
    a.status === "pending" && b.status !== "pending"
      ? -1
      : a.status !== "pending" && b.status === "pending"
        ? 1
        : 0,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("overview.needsOkTitle")}</CardTitle>
          <Link
            href="/dashboard/front-office"
            className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700"
          >
            {t("actions.viewAll")}
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("overview.noEscalations")}
          </p>
        ) : (
          <EscalationQueue initial={rows} />
        )}
      </CardContent>
    </Card>
  );
}

/** Most recent AI-answered calls. */
async function RecentCalls() {
  const { company } = await requireCompany();
  const t = await getTranslations("dashboard");
  const supabase = await createClient();

  const { data } = await supabase
    .from("front_office_ai_calls")
    .select("id, from_number, started_at, duration_seconds, escalated, outcome")
    .eq("company_id", company.id)
    .order("started_at", { ascending: false })
    .limit(8);
  const calls = (data ?? []) as {
    id: string;
    from_number: string;
    started_at: string;
    duration_seconds: number;
    escalated: boolean;
    outcome: string;
  }[];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("overview.recentCallsTitle")}</CardTitle>
          <Link
            href="/dashboard/front-office"
            className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700"
          >
            {t("actions.viewAll")}
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {calls.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("overview.noCalls")}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {calls.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                    {c.from_number || t("overview.unknownCaller")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDateTime(c.started_at)}
                    {c.outcome ? ` · ${c.outcome}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {Math.round((c.duration_seconds || 0) / 60)} {t("overview.min")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function QueueSkeleton() {
  return (
    <Card aria-hidden>
      <CardHeader>
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </CardContent>
    </Card>
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
