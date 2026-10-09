import { requirePlatformAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

export type StudioUser = {
  membershipId: string;
  userId: string;
  email: string;
  role: "owner" | "manager" | "cleaner";
  companyId: string;
  companyName: string;
  createdAt: string;
};

export const STUDIO_ROLES = ["owner", "manager", "cleaner"] as const;
export type StudioRole = (typeof STUDIO_ROLES)[number];

export function isStudioRole(v: unknown): v is StudioRole {
  return typeof v === "string" && (STUDIO_ROLES as readonly string[]).includes(v);
}

async function guardedService() {
  await requirePlatformAdmin();
  return createServiceClient();
}

/** Every SaaS user (membership) across all companies, newest first. */
export async function listStudioUsers(limit = 200): Promise<StudioUser[]> {
  const svc = await guardedService();
  const { data, error } = await svc
    .from("memberships")
    .select("id, user_id, email, role, company_id, created_at, companies(name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as unknown as {
    id: string;
    user_id: string;
    email: string;
    role: string;
    company_id: string;
    created_at: string;
    companies: { name: string } | null;
  }[]).map((m) => ({
    membershipId: m.id,
    userId: m.user_id,
    email: m.email,
    role: (m.role as StudioUser["role"]) ?? "cleaner",
    companyId: m.company_id,
    companyName: m.companies?.name ?? "—",
    createdAt: m.created_at,
  }));
}

/** Change a member's role within their company. */
export async function setStudioUserRole(
  membershipId: string,
  role: StudioRole,
): Promise<{ ok: true } | { error: string }> {
  const svc = await guardedService();
  const { error } = await svc
    .from("memberships")
    .update({ role })
    .eq("id", membershipId);
  if (error) return { error: "Couldn't update the role." };
  return { ok: true };
}

/**
 * Change a user's login email (auth user + all their memberships).
 * Note: depending on the Supabase auth settings this may ask the user to
 * confirm the new address before it takes effect.
 */
export async function setStudioUserEmail(
  userId: string,
  email: string,
): Promise<{ ok: true } | { error: string }> {
  const svc = await guardedService();
  const { error: authError } = await svc.auth.admin.updateUserById(userId, {
    email,
  });
  if (authError) return { error: "Couldn't update the email." };
  const { error: memError } = await svc
    .from("memberships")
    .update({ email })
    .eq("user_id", userId);
  if (memError) return { error: "Email updated on the account, but memberships didn't sync — check them manually." };
  return { ok: true };
}

/**
 * Delete a user entirely: all memberships, then the auth account.
 * Refuses to delete the platform admin performing the action.
 */
export async function deleteStudioUser(
  userId: string,
): Promise<{ ok: true } | { error: string }> {
  const admin = await requirePlatformAdmin();
  if (userId === admin.id) {
    return { error: "You can't delete your own account." };
  }
  const svc = await createServiceClient();
  const { error: memError } = await svc
    .from("memberships")
    .delete()
    .eq("user_id", userId);
  if (memError) return { error: "Couldn't remove the user's memberships." };
  const { error: authError } = await svc.auth.admin.deleteUser(userId);
  if (authError) return { error: "Memberships removed, but the login couldn't be deleted." };
  return { ok: true };
}
