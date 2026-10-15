import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCents, formatDate } from "@/lib/format";
import { CrmSetupNotice } from "@/components/studio/crm-setup-notice";
import { PLANS, isPlanId, subscriptionInGoodStanding } from "@/lib/plans";
import {
  CRM_STAGES,
  crmStageLabel,
  crmSourceLabel,
  type CrmContact,
} from "@/lib/studio/crm";

export const instant = false;

/** Studio overview — the founder's morning dashboard for the SaaS itself. */
export default async function StudioPage() {
  await requirePlatformAdmin();
  const svc = await createServiceClient();

  const [
    { count: companyCount },
    { count: userCount },
    { data: companies },
    { count: leadCount },
    { data: leads },
  ] = await Promise.all([
    svc.from("companies").select("id", { count: "exact", head: true }),
    svc.from("memberships").select("id", { count: "exact", head: true }),
    svc
      .from("companies")
      .select("id, name, plan, subscription_status, created_at"),
    svc.from("crm_contacts").select("id", { count: "exact", head: true }),
    svc
      .from("crm_contacts")
      .select("id, name, company_name, email, source, stage, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  // MRR from companies in good standing, priced by their plan.
  let mrrCents = 0;
  let paying = 0;
  for (const c of companies ?? []) {
    const row = c as {
      plan: string;
      subscription_status: string | null;
    };
    if (subscriptionInGoodStanding(row.subscription_status) && isPlanId(row.plan)) {
      mrrCents += PLANS[row.plan].priceCents;
      paying += 1;
    }
  }

  const { data: pipeline } = await svc
    .from("crm_contacts")
    .select("stage, deal_value_cents")
    .neq("stage", "lost");
  const openPipelineCents = (pipeline ?? []).reduce(
    (s, r) => s + ((r as { deal_value_cents: number | null }).deal_value_cents ?? 0),
    0,
  );

  // Platform-wide AI call activity — the core product metric. Wrapped so the
  // page still renders if the AI-answering migrations haven't been run here.
  let callsAnswered: number | null = null;
  let aiMinutes = 0;
  let pendingEscalations: number | null = null;
  let topByMinutes: { id: string; name: string; minutes: number }[] = [];
  try {
    const [{ count, data: calls }, { count: escalations }] =
      await Promise.all([
        svc
          .from("front_office_ai_calls")
          .select("company_id, duration_seconds", { count: "exact" }),
        svc
          .from("front_office_escalations")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);
    callsAnswered = count ?? 0;
    pendingEscalations = escalations ?? 0;
    const byCompany = new Map<string, number>();
    for (const r of (calls ?? []) as {
      company_id: string;
      duration_seconds: number | null;
    }[]) {
      const secs = r.duration_seconds ?? 0;
      aiMinutes += secs;
      byCompany.set(r.company_id, (byCompany.get(r.company_id) ?? 0) + secs);
    }
    aiMinutes = Math.round(aiMinutes / 60);
    const names = new Map(
      ((companies ?? []) as { id: string; name: string }[]).map((c) => [
        c.id,
        c.name,
      ]),
    );
    topByMinutes = [...byCompany.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, secs]) => ({
        id,
        name: names.get(id) ?? "Unknown company",
        minutes: Math.round(secs / 60),
      }));
  } catch {
    // Tables not migrated yet — the section shows "—".
  }

  const stats = [
    { label: "Companies", value: String(companyCount ?? 0), href: "/admin" },
    { label: "Users", value: String(userCount ?? 0), href: "/admin" },
    {
      label: "MRR",
      value: formatCents(mrrCents),
      hint: `${paying} paying`,
      href: "/admin",
    },
    { label: "CRM leads", value: String(leadCount ?? 0), href: "/studio/crm" },
    {
      label: "Open pipeline",
      value: formatCents(openPipelineCents),
      href: "/studio/crm",
    },
  ];

  const recentCompanies = (companies ?? [])
    .slice()
    .sort((a, b) => (b as { created_at: string }).created_at.localeCompare((a as { created_at: string }).created_at))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <CrmSetupNotice />
      <Heading
        title="Studio overview"
        description="The health of the Wavva business itself — revenue, companies, AI call activity, and your sales pipeline."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="py-5">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {s.label}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {s.value}
                </p>
                {s.hint && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {s.hint}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI call activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Calls answered
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {callsAnswered === null ? "—" : callsAnswered.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                AI minutes used
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {callsAnswered === null ? "—" : `${aiMinutes.toLocaleString()} min`}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Escalations pending
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {pendingEscalations === null
                  ? "—"
                  : pendingEscalations.toLocaleString()}
              </p>
            </div>
          </div>
          {topByMinutes.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Top companies by AI minutes
              </p>
              <div className="space-y-3">
                {topByMinutes.map((c) => {
                  const max = Math.max(1, ...topByMinutes.map((t) => t.minutes));
                  return (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                        {c.name}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{
                            width: `${Math.max(3, Math.round((c.minutes / max) * 100))}%`,
                          }}
                        />
                      </div>
                      <span className="w-20 text-right text-sm tabular-nums text-slate-500 dark:text-slate-400">
                        {c.minutes.toLocaleString()} min
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest leads</CardTitle>
            <Button href="/studio/crm" variant="outline" size="sm">
              Open CRM
            </Button>
          </CardHeader>
          <CardContent>
            {(leads ?? []).length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No leads yet. Trial requests from the website and contact-form
                messages land here automatically.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {(leads as CrmContact[]).map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/studio/crm/${l.id}`}
                        className="block truncate text-sm font-semibold text-slate-900 hover:underline dark:text-slate-100"
                      >
                        {l.name}
                        {l.company_name ? ` · ${l.company_name}` : ""}
                      </Link>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {crmSourceLabel(l.source)} · {formatDate(l.created_at)}
                      </p>
                    </div>
                    <Badge tone={l.stage === "lost" ? "slate" : "brand"}>
                      {crmStageLabel(l.stage)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Newest companies</CardTitle>
            <Button href="/admin" variant="outline" size="sm">
              Platform admin
            </Button>
          </CardHeader>
          <CardContent>
            {recentCompanies.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No companies yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentCompanies.map((c) => {
                  const row = c as {
                    id: string;
                    name: string;
                    plan: string;
                    subscription_status: string | null;
                    created_at: string;
                  };
                  return (
                    <li
                      key={row.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {row.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(row.created_at)}
                        </p>
                      </div>
                      <Badge
                        tone={
                          subscriptionInGoodStanding(row.subscription_status)
                            ? "accent"
                            : "slate"
                        }
                      >
                        {isPlanId(row.plan) ? PLANS[row.plan].name : row.plan}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline by stage</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineStages />
        </CardContent>
      </Card>
    </div>
  );
}

async function PipelineStages() {
  const svc = await createServiceClient();
  const { data } = await svc.from("crm_contacts").select("stage");
  const counts: Record<string, number> = {};
  for (const s of CRM_STAGES) counts[s.id] = 0;
  for (const row of data ?? []) {
    const st = (row as { stage: string }).stage;
    counts[st] = (counts[st] ?? 0) + 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="space-y-3">
      {CRM_STAGES.map((s) => (
        <div key={s.id} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-sm font-medium text-slate-700 dark:text-slate-300">
            {s.label}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${Math.round((counts[s.id] / total) * 100)}%` }}
            />
          </div>
          <span className="w-8 text-right text-sm tabular-nums text-slate-500 dark:text-slate-400">
            {counts[s.id]}
          </span>
        </div>
      ))}
    </div>
  );
}
