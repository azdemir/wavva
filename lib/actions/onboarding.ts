"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getActiveMembership } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  companySchema,
  serviceSchema,
  serviceAreaSchema,
  inviteSchema,
} from "@/lib/validation";

export type ActionResult = { error?: string; ok?: boolean };

function err(message: string): ActionResult {
  return { error: message };
}

/** Step 1: create the company (or update it when resuming onboarding). */
export async function saveCompanyProfile(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = companySchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    website: formData.get("website") || "",
    // Time zone is no longer asked during onboarding; default it here.
    // Users can change it later in Settings.
    timezone: formData.get("timezone") || "America/New_York",
  });
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const supabase = await createClient();
  const active = await getActiveMembership();
  const data = {
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    website: parsed.data.website || null,
    timezone: parsed.data.timezone,
  };

  if (active) {
    const { error } = await supabase
      .from("companies")
      .update(data)
      .eq("id", active.company.id);
    if (error) return err(error.message);
  } else {
    const { data: company, error: cErr } = await supabase
      .from("companies")
      .insert(data)
      .select("id")
      .single();
    if (cErr || !company) return err(cErr?.message ?? "Could not create company");

    const { error: mErr } = await supabase.from("memberships").insert({
      user_id: user.id,
      company_id: company.id,
      email: user.email ?? "",
      role: "owner",
    });
    if (mErr) return err(mErr.message);

    await logAudit(supabase, {
      company_id: company.id,
      action: "company.created",
      entity_type: "company",
      entity_id: company.id,
    });
  }

  redirect("/onboarding?step=2");
}

/** Step 2: replace the company's service catalog. */
export async function saveServices(
  items: unknown,
): Promise<ActionResult> {
  const ctx = await requireUser().then(async (user) => {
    const active = await getActiveMembership();
    if (!active) redirect("/onboarding");
    return { user, ...active };
  });

  const parsed = serviceSchema.array().min(1, "Add at least one service").safeParse(items);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid services");

  const supabase = await createClient();
  const { error: delErr } = await supabase
    .from("services")
    .delete()
    .eq("company_id", ctx.company.id);
  if (delErr) return err(delErr.message);

  const { error } = await supabase.from("services").insert(
    parsed.data.map((s) => ({
      company_id: ctx.company.id,
      name: s.name,
      category: s.category,
      description: s.description || null,
      base_price_cents: s.base_price_cents,
      unit: s.unit,
    })),
  );
  if (error) return err(error.message);

  redirect("/onboarding?step=3");
}

/** Step 3: replace the company's service areas. */
export async function saveServiceAreas(items: unknown): Promise<ActionResult> {
  const user = await requireUser();
  void user;
  const active = await getActiveMembership();
  if (!active) redirect("/onboarding");

  const parsed = serviceAreaSchema
    .array()
    .min(1, "Add at least one service area")
    .safeParse(items);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid areas");

  const supabase = await createClient();
  const { error: delErr } = await supabase
    .from("service_areas")
    .delete()
    .eq("company_id", active.company.id);
  if (delErr) return err(delErr.message);

  const { error } = await supabase.from("service_areas").insert(
    parsed.data.map((a) => ({
      company_id: active.company.id,
      area_type: a.area_type,
      value: a.value,
    })),
  );
  if (error) return err(error.message);

  redirect("/onboarding?step=4");
}

export type CreatedInvite = { email: string; role: string; link: string };

/** Step 4: create team invites. Returns shareable links (no email service yet). */
export async function createInvites(
  items: unknown,
  baseUrl: string,
): Promise<{ error?: string; invites?: CreatedInvite[] }> {
  const active = await getActiveMembership();
  if (!active) redirect("/onboarding");
  if (active.membership.role !== "owner") return { error: "Only owners can invite the team." };

  const parsed = inviteSchema.array().safeParse(items);
  if (!parsed.success) return { error: "One or more invites are invalid." };

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
