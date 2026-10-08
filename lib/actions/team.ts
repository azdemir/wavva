"use server";

import { rateLimit, limits, rateLimitError } from "@/lib/rate-limit";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireUser, requireOwner, getActiveMembership } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { inviteSchema } from "@/lib/validation";
import { PLANS, isPlanId, seatsAvailable, seatLimitLabel } from "@/lib/plans";

/** Owner creates a single invite from the Team page. */
export async function createInvite(
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const rl = await rateLimit("invite", limits.spammy.max, limits.spammy.windowMs);
  if (!rl.allowed) return rateLimitError(rl.resetIn);
  const ctx = await requireOwner();
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Enter a valid email and role." };

  const supabase = await createClient();

  // Plan seat limit: the plan lookup and the member count are
  // independent — run them together.
  const [{ data: companyRow }, { count: memberCount }] = await Promise.all([
    supabase
      .from("companies")
      .select("plan")
      .eq("id", ctx.company.id)
      .single(),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("company_id", ctx.company.id),
  ]);
  const planId = isPlanId(companyRow?.plan) ? companyRow.plan : "starter";
  if (!seatsAvailable(planId, memberCount ?? 0)) {
    return {
      error: `Your ${PLANS[planId].name} plan includes ${seatLimitLabel(planId)}. Upgrade in Settings → Billing to invite more people.`,
    };
  }

  const { error } = await supabase.from("invites").upsert(
    {
      company_id: ctx.company.id,
      email: parsed.data.email,
      role: parsed.data.role,
      accepted_at: null,
    },
    { onConflict: "company_id,email" },
  );
  if (error) return { error: error.message };

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "team.invited",
    entity_type: "invite",
    metadata: { email: parsed.data.email, role: parsed.data.role },
  });

  revalidatePath("/dashboard/team");
  return { ok: true };
}

/** Owner deletes a pending invite. */
export async function deleteInvite(id: string) {
  const ctx = await requireOwner();
  const supabase = await createClient();
  const { error } = await supabase
    .from("invites")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/team");
  return { ok: true };
}

export type AcceptResult = { error?: string };

/**
 * Accept an invite via its token. Uses the service-role client because the
 * invitee is not yet a member (RLS would deny them). Token possession is the
 * authorization; the invite email must match the signed-in user.
 */
export async function acceptInvite(token: string): Promise<AcceptResult> {
  const user = await requireUser();
  const svc = await createServiceClient();

  const { data: invite } = await svc
    .from("invites")
    .select("id, company_id, email, role")
    .eq("token", token)
    .is("accepted_at", null)
    .maybeSingle();

  if (!invite) {
    return { error: "This invite link is invalid or has already been used." };
  }
  if (invite.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return {
      error: `This invite was sent to ${invite.email}. Sign in with that address to accept it.`,
    };
  }

  const { data: existing } = await svc
    .from("memberships")
    .select("id")
    .eq("company_id", invite.company_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error } = await svc.from("memberships").insert({
      user_id: user.id,
      company_id: invite.company_id,
      email: user.email ?? invite.email,
      role: invite.role,
    });
    if (error) return { error: error.message };
  }

  await svc
    .from("invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  // New members land in the dashboard (company is already onboarded).
  redirect("/dashboard");
}

/** Helper for the invite page: describe a token without accepting it. */
export async function describeInvite(token: string) {
  const svc = await createServiceClient();
  const { data } = await svc
    .from("invites")
    .select("id, company_id, email, role, accepted_at, companies(name)")
    .eq("token", token)
    .maybeSingle();
  return data as {
    id: string;
    company_id: string;
    email: string;
    role: string;
    accepted_at: string | null;
    companies: { name: string } | null;
  } | null;
}

export async function userIsMemberOf(companyId: string) {
  const active = await getActiveMembership();
  return active?.company.id === companyId;
}
