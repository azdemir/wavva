import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

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
};

/** The signed-in user, or null (also null when Supabase isn't configured). */
export async function getSessionUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * The user's first membership + company.
 * NOTE (MVP): users with several companies always land in their first.
 * Company switching is a later-stage feature.
 */
export async function getActiveMembership(): Promise<{
  membership: Membership;
  company: Company;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("memberships")
    .select("id, user_id, company_id, email, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const { data: company } = await supabase
    .from("companies")
    .select(
      "id, name, logo_url, phone, email, website, timezone, currency, settings, onboarding_completed",
    )
    .eq("id", membership.company_id)
    .single();

  if (!company) return null;
  return { membership: membership as Membership, company: company as Company };
}

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
 * Require a signed-in user with an onboarded company.
 * - No user -> /signin
 * - User without company -> /onboarding
 * - Company without completed onboarding -> /onboarding
 */
export async function requireCompany() {
  const user = await requireUser();
  const active = await getActiveMembership();
  if (!active) redirect("/onboarding");
  if (!active.company.onboarding_completed) redirect("/onboarding");
  return { user, ...active };
}

/** Require an owner (for team management, settings, billing). */
export async function requireOwner() {
  const ctx = await requireCompany();
  if (ctx.membership.role !== "owner") redirect("/dashboard");
  return ctx;
}
