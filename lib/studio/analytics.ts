import { createServiceClient } from "@/lib/supabase/server";
import { PLANS, isPlanId, subscriptionInGoodStanding, type PlanId } from "@/lib/plans";
import { CRM_STAGES, type CrmStage } from "@/lib/studio/crm";

export type WeekBucket = { start: string; label: string; companies: number; leads: number };
export type PlanSlice = { plan: PlanId; count: number; mrrCents: number };
export type FunnelStep = { stage: CrmStage; count: number; conversionFromPrev: number | null };
export type SourceSlice = { source: string; count: number };
export type RecentCompany = {
  id: string;
  name: string;
  plan: string;
  status: string | null;
  createdAt: string;
  customers: number;
};

export type AnalyticsData = {
  companies: number;
  users: number;
  mrrCents: number;
  payingCompanies: number;
  trialingCompanies: number;
  leads: number;
  pipelineCents: number;
  customers: number;
  leadToCustomerPct: number;
  weeks: WeekBucket[];
  planMix: PlanSlice[];
  funnel: FunnelStep[];
  sources: SourceSlice[];
  recent: RecentCompany[];
  topByCustomers: RecentCompany[];
};

export type AnalyticsFilter = {
  weeks: 4 | 12 | 26;
  plan: "all" | PlanId;
  q: string;
};

export const ANALYTICS_WEEKS: AnalyticsFilter["weeks"][] = [4, 12, 26];

function weekBuckets(count: number): WeekBucket[] {
  const out: WeekBucket[] = [];
  const now = new Date();
  // Start of the current week (Monday).
  const monday = new Date(now);
  const day = (now.getDay() + 6) % 7;
  monday.setDate(now.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(monday);
    start.setDate(monday.getDate() - i * 7);
    out.push({
      start: start.toISOString(),
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      companies: 0,
      leads: 0,
    });
  }
  return out;
}

export function parseAnalyticsFilter(sp: {
  weeks?: string;
  plan?: string;
  q?: string;
}): AnalyticsFilter {
  const weeks = [4, 12, 26].includes(Number(sp.weeks))
    ? (Number(sp.weeks) as 4 | 12 | 26)
    : 12;
  const plan =
    sp.plan === "starter" || sp.plan === "growth" || sp.plan === "pro"
      ? sp.plan
      : "all";
  return { weeks, plan, q: (sp.q ?? "").trim().slice(0, 80) };
}

/**
 * Founder analytics for the SaaS itself. Call after requirePlatformAdmin();
 * reads through the service-role client.
 *
 * `weeks` scopes the signups chart and the lead window; `plan`/`q` scope the
 * company tables (and the Excel export). Headline KPIs and the plan mix stay
 * global.
 */
export async function getAnalytics(
  filter: AnalyticsFilter = { weeks: 12, plan: "all", q: "" },
): Promise<AnalyticsData> {
  const svc = await createServiceClient();
  const since = new Date();
  since.setDate(since.getDate() - filter.weeks * 7);

  const [{ data: companies }, { count: userCount }, { data: leads }] =
    await Promise.all([
      svc
        .from("companies")
        .select("id, name, plan, subscription_status, created_at")
        .order("created_at", { ascending: false }),
      svc.from("memberships").select("id", { count: "exact", head: true }),
      svc
        .from("crm_contacts")
        .select("id, stage, source, value_cents, created_at")
        .gte("created_at", since.toISOString()),
    ]);

  // Customers per company (for the "customers per business" column).
  const { data: customerRows } = await svc.from("customers").select("company_id");
  const customersByCompany = new Map<string, number>();
  for (const r of (customerRows ?? []) as { company_id: string }[]) {
    customersByCompany.set(r.company_id, (customersByCompany.get(r.company_id) ?? 0) + 1);
  }

  const companyRows = (companies ?? []) as {
    id: string;
    name: string;
    plan: string;
    subscription_status: string | null;
    created_at: string;
  }[];
  const leadRows = (leads ?? []) as {
    id: string;
    stage: string;
    source: string | null;
    value_cents: number | null;
    created_at: string;
  }[];

  // MRR + plan mix from companies in good standing.
  let mrrCents = 0;
  let paying = 0;
  let trialing = 0;
  const planCounts: Record<PlanId, { count: number; mrrCents: number }> = {
    starter: { count: 0, mrrCents: 0 },
    growth: { count: 0, mrrCents: 0 },
    pro: { count: 0, mrrCents: 0 },
  };
  for (const c of companyRows) {
    if (isPlanId(c.plan)) planCounts[c.plan].count += 1;
    if (subscriptionInGoodStanding(c.subscription_status)) {
      paying += 1;
      if (c.subscription_status === "trialing") trialing += 1;
      if (isPlanId(c.plan)) {
        const cents = PLANS[c.plan].priceCents;
        mrrCents += cents;
        planCounts[c.plan].mrrCents += cents;
      }
    }
  }

  // Lead funnel.
  const stageCounts = new Map<CrmStage, number>();
  for (const s of CRM_STAGES) stageCounts.set(s.id, 0);
  let pipelineCents = 0;
  const sourceCounts = new Map<string, number>();
  for (const l of leadRows) {
    const stage = (l.stage as CrmStage) ?? "new";
    stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1);
    if (l.stage !== "customer" && l.stage !== "lost") {
      pipelineCents += l.value_cents ?? 0;
    }
    const src = l.source || "unknown";
    sourceCounts.set(src, (sourceCounts.get(src) ?? 0) + 1);
  }
  // Funnel needs all-time stage counts, not just the 12-week window.
  const { data: allStages } = await svc.from("crm_contacts").select("stage");
  const allStageCounts = new Map<CrmStage, number>();
  for (const s of CRM_STAGES) allStageCounts.set(s.id, 0);
  for (const r of (allStages ?? []) as { stage: string }[]) {
    const s = r.stage as CrmStage;
    allStageCounts.set(s, (allStageCounts.get(s) ?? 0) + 1);
  }
  const funnel: FunnelStep[] = CRM_STAGES.map(({ id: stage }, i) => {
    const count = allStageCounts.get(stage) ?? 0;
    const prev = i === 0 ? null : (allStageCounts.get(CRM_STAGES[i - 1].id) ?? 0);
    return {
      stage,
      count,
      conversionFromPrev: prev === null || prev === 0 ? null : count / prev,
    };
  });
  const totalLeads = (allStageCounts.get("new") ?? 0) + (allStageCounts.get("contacted") ?? 0) +
    (allStageCounts.get("trial") ?? 0) + (allStageCounts.get("customer") ?? 0) +
    (allStageCounts.get("lost") ?? 0);
  const customers = allStageCounts.get("customer") ?? 0;

  // Weekly buckets.
  const weeks = weekBuckets(filter.weeks);
  const starts = weeks.map((w) => new Date(w.start).getTime());
  const bucketOf = (iso: string) => {
    const t = new Date(iso).getTime();
    for (let i = starts.length - 1; i >= 0; i--) {
      if (t >= starts[i]) return i;
    }
    return -1;
  };
  for (const c of companyRows) {
    const i = bucketOf(c.created_at);
    if (i >= 0) weeks[i].companies += 1;
  }
  for (const l of leadRows) {
    const i = bucketOf(l.created_at);
    if (i >= 0) weeks[i].leads += 1;
  }

  const toRecent = (c: (typeof companyRows)[number]): RecentCompany => ({
    id: c.id,
    name: c.name,
    plan: c.plan,
    status: c.subscription_status,
    createdAt: c.created_at,
    customers: customersByCompany.get(c.id) ?? 0,
  });

  // Company tables honor the plan + search filters.
  const ql = filter.q.toLowerCase();
  const tableCompanies = companyRows.filter(
    (c) =>
      (filter.plan === "all" || c.plan === filter.plan) &&
      (!ql || c.name.toLowerCase().includes(ql)),
  );

  return {
    companies: companyRows.length,
    users: userCount ?? 0,
    mrrCents,
    payingCompanies: paying,
    trialingCompanies: trialing,
    leads: totalLeads,
    pipelineCents,
    customers: customers,
    leadToCustomerPct: totalLeads === 0 ? 0 : customers / totalLeads,
    weeks,
    planMix: (Object.keys(planCounts) as PlanId[]).map((plan) => ({
      plan,
      ...planCounts[plan],
    })),
    funnel,
    sources: [...sourceCounts.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    recent: tableCompanies.slice(0, 8).map(toRecent),
    topByCustomers: [...tableCompanies]
      .sort(
        (a, b) =>
          (customersByCompany.get(b.id) ?? 0) - (customersByCompany.get(a.id) ?? 0),
      )
      .slice(0, 8)
      .map(toRecent),
  };
}
