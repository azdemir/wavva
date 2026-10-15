import { requirePlatformAdmin } from "@/lib/admin";
import { isCompanyTierManaged } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { PLANS, hasAllAccess, isPlanId, type PlanId } from "@/lib/plans";

export type StudioCompany = {
  companyId: string;
  name: string;
  /** Raw companies.plan value (may be null when never set). */
  storedPlan: string | null;
  /** What the app actually enforces for this company right now. */
  effectivePlan: PlanId;
  /** True when a founder/platform-admin grant is behind the effective plan. */
  grantApplies: boolean;
  ownerEmail: string;
  ownerUserId: string | null;
  memberCount: number;
  customerCount: number;
  /** Every member email — powers the search box. */
  memberEmails: string[];
  createdAt: string;
};

export type TierChangeEntry = {
  id: string;
  companyId: string;
  companyName: string;
  affectedUserEmail: string;
  previousTier: string;
  newTier: string;
  adminEmail: string;
  createdAt: string;
};

/** Platform-admin gate, then a service-role client (same as lib/studio/users.ts). */
async function guardedService() {
  await requirePlatformAdmin();
  return createServiceClient();
}

/**
 * Effective plan for a company, mirroring requireCompany() in lib/auth.ts:
 * the founder / platform-admin all-access grant reports Complete unless the
 * company's tier was explicitly changed in Studio, in which case the
 * explicit choice wins (so the owner can move their own account up or down).
 */
export function studioEffectivePlan(
  storedPlan: string | null,
  hasAllAccessMember: boolean,
  tierManaged: boolean,
): { effective: PlanId; grantApplies: boolean } {
  if (hasAllAccessMember && !tierManaged) return { effective: "complete", grantApplies: true };
  return {
    effective: isPlanId(storedPlan) ? storedPlan : "essential",
    grantApplies: false,
  };
}

type CompanyRow = {
  id: string;
  name: string;
  plan: string | null;
  created_at: string;
};

type MembershipRow = {
  company_id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
};

/** Every company with its owner, member/customer counts, and effective tier. */
export async function listStudioCompanies(limit = 200): Promise<StudioCompany[]> {
  const svc = await guardedService();
  const { data: companies, error } = await svc
    .from("companies")
    .select("id, name, plan, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !companies) return [];
  const rows = companies as CompanyRow[];
  const ids = rows.map((c) => c.id);
  if (ids.length === 0) return [];

  const [{ data: memberships }, { data: customers }, { data: managedRows }] =
    await Promise.all([
      svc
        .from("memberships")
        .select("company_id, user_id, email, role, created_at")
        .in("company_id", ids)
        .order("created_at", { ascending: true }),
      svc.from("customers").select("company_id").in("company_id", ids),
      // Any tier_change_log row marks the company as explicitly managed.
      svc.from("tier_change_log").select("company_id").in("company_id", ids),
    ]);
  // 42P01 = the 0018 migration was never run: treat every company as unmanaged.
  const managed = new Set(
    ((managedRows ?? []) as { company_id: string }[]).map((r) => r.company_id),
  );
  const memberByCompany = new Map<string, MembershipRow[]>();
  for (const m of ((memberships ?? []) as MembershipRow[])) {
    const list = memberByCompany.get(m.company_id) ?? [];
    list.push(m);
    memberByCompany.set(m.company_id, list);
  }
  const customerCountByCompany = new Map<string, number>();
  for (const c of ((customers ?? []) as { company_id: string }[])) {
    customerCountByCompany.set(
      c.company_id,
      (customerCountByCompany.get(c.company_id) ?? 0) + 1,
    );
  }

  return rows.map((c) => {
    const members = memberByCompany.get(c.id) ?? [];
    const owner =
      members.find((m) => m.role === "owner") ?? members[0] ?? null;
    const hasAllAccessMember = members.some((m) => hasAllAccess(m.email));
    const { effective, grantApplies } = studioEffectivePlan(
      c.plan,
      hasAllAccessMember,
      managed.has(c.id),
    );
    return {
      companyId: c.id,
      name: c.name ?? "Unnamed company",
      storedPlan: c.plan,
      effectivePlan: effective,
      grantApplies,
      ownerEmail: owner?.email ?? "—",
      ownerUserId: owner?.user_id ?? null,
      memberCount: members.length,
      customerCount: customerCountByCompany.get(c.id) ?? 0,
      memberEmails: members.map((m) => m.email),
      createdAt: c.created_at,
    };
  });
}

/** Recent tier changes, newest first — the audit trail. */
export async function listTierChangeLog(limit = 100): Promise<TierChangeEntry[]> {
  const svc = await guardedService();
  const { data, error } = await svc
    .from("tier_change_log")
    .select(
      "id, company_id, company_name, affected_user_email, previous_tier, new_tier, admin_email, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (
    data as {
      id: string;
      company_id: string;
      company_name: string;
      affected_user_email: string;
      previous_tier: string;
      new_tier: string;
      admin_email: string;
      created_at: string;
    }[]
  ).map((r) => ({
    id: r.id,
    companyId: r.company_id,
    companyName: r.company_name || "—",
    affectedUserEmail: r.affected_user_email || "—",
    previousTier: r.previous_tier,
    newTier: r.new_tier,
    adminEmail: r.admin_email || "—",
    createdAt: r.created_at,
  }));
}

export type SetTierResult =
  | { ok: true; companyName: string; previousTier: PlanId; newTier: PlanId }
  | { error: string };

/**
 * Change a company's subscription tier and log the change.
 *
 * Backend enforcement: requirePlatformAdmin() runs FIRST — the UI never
 * decides who may do this. Works for any company, including the acting
 * admin's own (no self-change block). An explicit change overrides the
 * founder all-access grant for that company from now on (see
 * requireCompany() in lib/auth.ts).
 */
export async function setCompanyTier(
  companyId: string,
  newTier: PlanId,
): Promise<SetTierResult> {
  const admin = await requirePlatformAdmin();
  const svc = await createServiceClient();

  const { data: company } = await svc
    .from("companies")
    .select("id, name, plan")
    .eq("id", companyId)
    .maybeSingle();
  if (!company) return { error: "Company not found." };
  const row = company as { id: string; name: string | null; plan: string | null };

  const { data: memberships } = await svc
    .from("memberships")
    .select("user_id, email, role")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });
  const members = ((memberships ?? []) as MembershipRow[]).filter(Boolean);
  const owner = members.find((m) => m.role === "owner") ?? members[0] ?? null;

  // Effective tier before the change (what the app was actually enforcing).
  const managedBefore = await isCompanyTierManaged(companyId).catch(() => false);
  const { effective: previousEffective } = studioEffectivePlan(
    row.plan,
    members.some((m) => hasAllAccess(m.email)),
    managedBefore,
  );
  if (previousEffective === newTier) {
    return { error: `Already on the ${PLANS[previousEffective].name} tier.` };
  }

  const { error: updateError } = await svc
    .from("companies")
    .update({ plan: newTier })
    .eq("id", companyId);
  if (updateError) return { error: "Couldn't update the tier — try again." };

  const { error: logError } = await svc.from("tier_change_log").insert({
    company_id: companyId,
    company_name: row.name ?? "",
    affected_user_id: owner?.user_id ?? null,
    affected_user_email: owner?.email ?? "",
    previous_tier: previousEffective,
    new_tier: newTier,
    admin_email: admin.email ?? "",
  });
  if (logError) {
    // 42P01 = migration 0018 was never run. Revert so we never have an
    // unlogged tier change, and tell the admin exactly what to run.
    await svc.from("companies").update({ plan: row.plan }).eq("id", companyId);
    if ((logError as { code?: string }).code === "42P01") {
      return {
        error:
          "The audit table isn't set up yet, so the change was reverted. Run supabase/migrations/0018_tier_change_log.sql in your Supabase SQL editor, then try again.",
      };
    }
    return {
      error:
        "The tier couldn't be logged, so the change was reverted. Try again.",
    };
  }

  return {
    ok: true,
    companyName: row.name ?? "The company",
    previousTier: previousEffective,
    newTier,
  };
}
