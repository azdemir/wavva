import { requirePlatformAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents, formatDate } from "@/lib/format";
import { PLANS, isPlanId, subscriptionInGoodStanding } from "@/lib/plans";

export const instant = false;

/** Platform overview: companies, plans, AI call usage, and invoiced volume. */
export default async function AdminPage() {
  await requirePlatformAdmin();
  const svc = await createServiceClient();

  const [
    { count: companyCount },
    { count: userCount },
    { count: bookingCount },
    { data: invoices },
    { data: companies },
  ] = await Promise.all([
    svc.from("companies").select("id", { count: "exact", head: true }),
    svc.from("memberships").select("id", { count: "exact", head: true }),
    svc.from("bookings").select("id", { count: "exact", head: true }),
    svc.from("invoices").select("total_cents, status").neq("status", "void"),
    svc
      .from("companies")
      .select(
        "id, name, email, phone, timezone, plan, subscription_status, onboarding_completed, created_at, stripe_onboarded",
      )
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const gmv = (invoices ?? []).reduce((s, i) => s + i.total_cents, 0);

  // AI call usage across the platform. Wrapped so the page still renders if
  // the AI-answering migrations haven't been run on this environment.
  let callsAnswered: number | null = null;
  let aiMinutes: number | null = null;
  let pendingEscalations: number | null = null;
  try {
    const [{ count, data: calls }, { count: escalations }] = await Promise.all([
      svc.from("front_office_ai_calls").select("duration_seconds", { count: "exact" }),
      svc
        .from("front_office_escalations")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);
    callsAnswered = count ?? 0;
    aiMinutes = Math.round(
      (calls ?? []).reduce(
        (s, r) => s + ((r as { duration_seconds: number | null }).duration_seconds ?? 0),
        0,
      ) / 60,
    );
    pendingEscalations = escalations ?? 0;
  } catch {
    // Tables not migrated yet — stats show "—".
  }

  // Member counts per company.
  const { data: memberships } = await svc.from("memberships").select("company_id");
  const memberCount = new Map<string, number>();
  for (const m of memberships ?? []) {
    memberCount.set(m.company_id, (memberCount.get(m.company_id) ?? 0) + 1);
  }

  const dash = (v: number | null) => (v === null ? "—" : v.toLocaleString());

  const stats = [
    { label: "Companies", value: String(companyCount ?? 0) },
    { label: "Users", value: String(userCount ?? 0) },
    { label: "Calls answered", value: dash(callsAnswered) },
    {
      label: "AI minutes",
      value: aiMinutes === null ? "—" : `${aiMinutes.toLocaleString()} min`,
    },
    {
      label: "Escalations pending",
      value: dash(pendingEscalations),
    },
    { label: "Bookings", value: String(bookingCount ?? 0) },
    { label: "Invoiced volume", value: formatCents(gmv) },
  ];

  return (
    <div className="space-y-8">
      <Heading
        title="Platform overview"
        description="All companies on Wavva. This view bypasses RLS via the service role — keep the admin allowlist tight."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 dark:text-slate-100">{s.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Companies ({companies?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-500">
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 text-center font-medium">Members</th>
                  <th className="px-5 py-3 text-center font-medium">Onboarded</th>
                  <th className="px-5 py-3 text-center font-medium">Stripe</th>
                  <th className="px-5 py-3 text-right font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 dark:divide-slate-800">
                {(companies ?? []).map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100 dark:text-slate-100">{c.name}</td>
                    <td className="px-5 py-3">
                      <Badge
                        tone={
                          subscriptionInGoodStanding(c.subscription_status)
                            ? "accent"
                            : "slate"
                        }
                      >
                        {isPlanId(c.plan) ? PLANS[c.plan].name : (c.plan ?? "—")}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400 dark:text-slate-500 dark:text-slate-500">
                      {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-5 py-3 text-center">{memberCount.get(c.id) ?? 0}</td>
                    <td className="px-5 py-3 text-center">
                      <Badge tone={c.onboarding_completed ? "accent" : "slate"}>
                        {c.onboarding_completed ? "Yes" : "No"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge tone={c.stripe_onboarded ? "accent" : "slate"}>
                        {c.stripe_onboarded ? "Live" : "—"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-500">
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
