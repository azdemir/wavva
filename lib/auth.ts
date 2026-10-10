import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { connection } from "next/server";
import {
  createClient,
  createServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { hasAllAccess, isPlanId } from "@/lib/plans";
import { one } from "@/lib/relations";

export type Membership = {
  id: string;
  user_id: string;
  company_id: string;
  email: string;
  role: "owner" | "manager" | "cleaner";
};

export type Company = {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  timezone: string;
  currency: string;
  settings: Record<string, unknown>;
  onboarding_completed: boolean;
  plan: string | null;
  subscription_status: string | null;
};

/**
 * The signed-in user, or null (also null when Supabase isn't configured).
 *
 * `await connection()` is deliberate and load-bearing. Under Cache
 * Components the prerenderer otherwise tries to evaluate this function while
 * building the static shell, which runs supabase-js — and its GoTrueClient
 * stamps `Date.now()` into its refresh-timer setup, an unstable value Next
 * refuses to prerender. connection() declares this branch request-time
 * before any of that runs, so the caller's Suspense boundary streams as a
 * dynamic hole instead.
 *
 * Cached per request: the dashboard layout and the page under it both call
 * requireCompany(), and each auth check would otherwise cost a separate
 * `auth.getUser()` round trip to the Supabase auth server.
 */
export const getSessionUser = cache(async function getSessionUser() {
  await connection();
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * The user's first membership + company.
 * NOTE (MVP): users with several companies always land in their first.
 * Company switching is a later-stage feature.
 *
 * Cached per request (the dashboard layout and its pages all call this), and
 * fetched with a single join query instead of sequential membership +
 * company round trips.
 */
export const getActiveMembership = cache(async function getActiveMembership(): Promise<{
  membership: Membership;
  company: Company;
} | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("memberships")
    .select(
      "id, user_id, company_id, email, role, companies(id, name, logo_url, phone, email, website, timezone, currency, settings, onboarding_completed, plan, subscription_status)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) return null;
  const company = one(membership.companies) as Company | null;
  if (!company) return null;
  const { id, user_id, company_id, email, role } = membership;
  return {
    membership: { id, user_id, company_id, email, role } as Membership,
    company,
  };
});

/** Require a signed-in user; otherwise send to /signin (preserving destination). */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    const pathname = (await headers()).get("x-pathname");
    redirect(
      pathname && pathname !== "/"
        ? `/signin?next=${encodeURIComponent(pathname)}`
        : "/signin",
    );
  }
  return user;
}

/**
 * Whether a company's tier was ever changed explicitly in Studio
 * (/studio/tiers). Used to decide if the founder all-access grant still
 * applies. Never throws: any failure (e.g. the 0018 migration was never
 * run) means "not managed", so the grant stands.
 */
export async function isCompanyTierManaged(companyId: string): Promise<boolean> {
  try {
    const svc = await createServiceClient();
    const { data, error } = await svc
      .from("tier_change_log")
      .select("id")
      .eq("company_id", companyId)
      .limit(1)
      .maybeSingle();
    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * Require a signed-in user with an onboarded company.
 * - No user -> /signin
 * - User without company -> /onboarding
 * - Company without completed onboarding -> /onboarding
 *
 * Founder / platform-admin accounts get every tier's features: their
 * company reports as Pro regardless of the stored plan — UNLESS the tier
 * was changed explicitly in Studio (/studio/tiers). An explicit change
 * always wins, so the owner can move their own company to any tier,
 * up or down, and the new tier's features and limits apply consistently.
 */
export async function requireCompany() {
  const user = await requireUser();
  const active = await getActiveMembership();
  if (!active) redirect("/onboarding");
  if (!active.company.onboarding_completed) redirect("/onboarding");
  if (hasAllAccess(user.email)) {
    let plan = "pro";
    if (
      (await isCompanyTierManaged(active.company.id).catch(() => false)) &&
      isPlanId(active.company.plan)
    ) {
      plan = active.company.plan;
    }
    return { user, ...active, company: { ...active.company, plan } };
  }
  return { user, ...active };
}

/** Require an owner (for team management, settings, billing). */
export async function requireOwner() {
  const ctx = await requireCompany();
  if (ctx.membership.role !== "owner") redirect("/dashboard");
  return ctx;
}
