import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/admin";
import { getAnalytics } from "@/lib/studio/analytics";
import { crmSourceLabel } from "@/lib/studio/crm";
import { PLANS } from "@/lib/plans";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents, formatDate } from "@/lib/format";
import { WeeklyBars, PlanDonut, Funnel } from "@/components/studio/charts";

export const instant = false;

export const metadata = {
  title: "Analytics",
  description: "TidyPro Studio — SaaS growth, revenue, and pipeline analytics.",
};

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </p>
        {sub && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

/** Studio analytics — the founder's growth/revenue/pipeline view. */
export default async function StudioAnalyticsPage() {
  await requirePlatformAdmin();
  let data;
  try {
    data = await getAnalytics();
  } catch {
    return (
      <div className="space-y-6">
        <Heading title="Analytics" description="Growth, revenue, and pipeline for the TidyPro SaaS itself." />
        <Card>
          <CardContent className="pt-6 text-sm text-slate-600 dark:text-slate-300">
            Analytics needs the Supabase connection. Set the Supabase environment
            variables and run the migrations, then reload.
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxSource = Math.max(1, ...data.sources.map((s) => s.count));

  return (
    <div className="space-y-6">
      <Heading
        title="Analytics"
        description="Growth, revenue, and pipeline for the TidyPro SaaS itself."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="MRR"
          value={formatCents(data.mrrCents)}
          sub={`${data.payingCompanies} paying · ${data.trialingCompanies} trialing`}
        />
        <Kpi
          label="Companies"
          value={String(data.companies)}
          sub={`${data.users} total users`}
        />
        <Kpi
          label="Leads → customers"
          value={`${(data.leadToCustomerPct * 100).toFixed(1)}%`}
          sub={`${data.customers} customers from ${data.leads} leads`}
        />
        <Kpi
          label="Open pipeline"
          value={formatCents(data.pipelineCents)}
          sub="deal value in New / Contacted / On trial"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Signups — last 12 weeks</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyBars weeks={data.weeks} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Plan mix</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanDonut mix={data.planMix} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Lead funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <Funnel steps={data.funnel} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Lead sources</CardTitle>
          </CardHeader>
          <CardContent>
            {data.sources.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No leads yet.</p>
            ) : (
              <ol className="space-y-3">
                {data.sources.map((s) => (
                  <li key={s.source}>
                    <div className="mb-1 flex items-baseline justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {crmSourceLabel(s.source)}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {s.count}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${Math.max(3, (s.count / maxSource) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Newest companies</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No companies yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="py-2 pr-4 font-medium">Company</th>
                    <th className="py-2 pr-4 font-medium">Plan</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                    >
                      <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-slate-100">
                        {c.name}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge tone="brand">
                          {PLANS[c.plan as keyof typeof PLANS]?.name ?? c.plan}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">
                        {c.status ?? "—"}
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300">
                        {formatDate(c.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4">
            <Link
              href="/studio/crm"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Open the CRM →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
