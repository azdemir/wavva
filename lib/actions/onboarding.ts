"use server";

import { rateLimit, limits, rateLimitError } from "@/lib/rate-limit";
import { getTranslations } from "next-intl/server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireUser, getActiveMembership } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { uploadCompanyLogo, hasLogoFile, type LogoUploadError } from "@/lib/company-logo";
import {
  companySchema,
  inviteSchema,
} from "@/lib/validation";

export type ActionResult = { error?: string; ok?: boolean };

function err(message: string): ActionResult {
  return { error: message };
}

const logoErrorKeys: Record<LogoUploadError, string> = {
  not_setup: "errors.logoNotSetup",
  invalid_type: "errors.logoInvalidType",
  too_large: "errors.logoTooLarge",
  upload_failed: "errors.logoUploadFailed",
};

/** Step 1: create the company (or update it when resuming onboarding). */
export async function saveCompanyProfile(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const t = await getTranslations("onboarding");
  const parsed = companySchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || "",
    owner_phone: formData.get("owner_phone") || "",
    email: formData.get("email") || "",
    website: formData.get("website") || "",
    timezone: formData.get("timezone") || "America/New_York",
  });
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? t("errors.invalidInput"));

  const supabase = await createClient();
  const active = await getActiveMembership();
  const data = {
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    website: parsed.data.website || null,
    timezone: parsed.data.timezone,
  };
  // Client used for company writes below. In the bootstrap path this may
  // become the service-role fallback when the user-scoped insert hits RLS.
  let db = supabase;
  let newCompany: { id: string } | null = null;

  if (active) {
    const { error } = await supabase
      .from("companies")
      .update(data)
      .eq("id", active.company.id);
    if (error) return err(error.message);
  } else {
    // Bootstrap: the user has no company/membership yet, so tenant RLS
    // policies can't authorize this insert via the normal path. Prefer the
    // user-scoped client (respects RLS as designed). If the deployment's
    // JWT claims aren't reaching RLS (auth.uid() null), fall back to the
    // service_role client — authentication was already verified via
    // requireUser() above, and we create exactly one company + one owner
    // membership for that verified user.
    const attempt = await supabase
      .from("companies")
      .insert(data)
      .select("id")
      .single();
    if (attempt.error) {
      const isRls = attempt.error.code === "42501";
      const hasSvcKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
      if (!isRls || !hasSvcKey) return err(attempt.error.message);
      const svc = await createServiceClient();
      const retry = await svc
        .from("companies")
        .insert(data)
        .select("id")
        .single();
      if (retry.error || !retry.data) {
        return err(retry.error?.message ?? t("errors.couldNotCreateCompany"));
      }
      db = svc;
      newCompany = retry.data;
    } else {
      newCompany = attempt.data;
    }

    const { error: mErr } = await db.from("memberships").insert({
      user_id: user.id,
      company_id: newCompany!.id,
      email: user.email ?? "",
      role: "owner",
    });
    if (mErr) return err(mErr.message);

    await logAudit(db, {
      company_id: newCompany!.id,
      action: "company.created",
      entity_type: "company",
      entity_id: newCompany!.id,
    });
  }

  // Optional logo: upload after the company exists so the storage key can
  // include the company id.
  const companyId = active ? active.company.id : newCompany!.id;
  const logoValue = formData.get("logo");
  if (hasLogoFile(logoValue)) {
    const up = await uploadCompanyLogo(
      companyId,
      logoValue,
      active?.company.logo_url ?? null,
    );
    if (up.error) return err(t(logoErrorKeys[up.error]));
    // In the bootstrap path `db` may be the service-role fallback client
    // when the user-scoped insert hit RLS; reuse it for the logo update.
    const logoDb = active ? supabase : db;
    const { error: logoErr } = await logoDb
      .from("companies")
      .update({ logo_url: up.url })
      .eq("id", companyId);
    if (logoErr) return err(logoErr.message);
  }

  // Owner mobile: the AI texts this number when it needs a human.
  // Stored on front_office_settings (upsert; the row may not exist yet).
  if (parsed.data.owner_phone) {
    const settingsDb = active ? supabase : db;
    const { error: foErr } = await settingsDb
      .from("front_office_settings")
      .upsert(
        {
          company_id: companyId,
          plan: "front_desk",
          owner_phone: parsed.data.owner_phone,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id" },
      );
    if (foErr) return err(foErr.message);
  }

  redirect("/onboarding?step=2");
}

export type CreatedInvite = { email: string; role: string; link: string };

/** Step 2: create team invites. Returns shareable links (no email service yet). */
export async function createInvites(
  items: unknown,
  baseUrl: string,
): Promise<{ error?: string; invites?: CreatedInvite[] }> {
  const rl = await rateLimit("invite", limits.spammy.max, limits.spammy.windowMs);
  if (!rl.allowed) return rateLimitError(rl.resetIn);
  const active = await getActiveMembership();
  if (!active) redirect("/onboarding");
  const t = await getTranslations("onboarding");
  if (active.membership.role !== "owner") return { error: t("errors.onlyOwnersInvite") };

  const parsed = inviteSchema.array().safeParse(items);
  if (!parsed.success) return { error: t("errors.invalidInvites") };

  const supabase = await createClient();
  const created: CreatedInvite[] = [];

  for (const inv of parsed.data) {
    // Skip people who are already members.
    const { data: existing } = await supabase
      .from("memberships")
      .select("id")
      .eq("company_id", active.company.id)
      .eq("email", inv.email)
      .maybeSingle();
    if (existing) continue;

    const { data, error } = await supabase
      .from("invites")
      .upsert(
        {
          company_id: active.company.id,
          email: inv.email,
          role: inv.role,
          accepted_at: null,
        },
        { onConflict: "company_id,email" },
      )
      .select("token, email, role")
      .single();
    if (error) return { error: error.message };
    created.push({
      email: data.email,
      role: data.role,
      link: `${baseUrl}/invite/${data.token}`,
    });
  }

  await logAudit(supabase, {
    company_id: active.company.id,
    action: "team.invited",
    entity_type: "invite",
    metadata: { count: created.length },
  });

  return { invites: created };
}

/** Finish onboarding and enter the dashboard. */
export async function completeOnboarding(): Promise<ActionResult> {
  const active = await getActiveMembership();
  if (!active) redirect("/onboarding");

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({ onboarding_completed: true })
    .eq("id", active.company.id);
  if (error) return err(error.message);

  redirect("/dashboard");
}
