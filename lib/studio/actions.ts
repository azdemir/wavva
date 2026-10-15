"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { Resend } from "resend";
import { requirePlatformAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimit, limits, rateLimitError } from "@/lib/rate-limit";
import { getContentDef, validateContentValue } from "./registry";
import { isCrmActivityKind, crmStageLabel } from "./crm";

export type ActionResult = { ok?: boolean; error?: string };

// ---------------------------------------------------------------------------
// Website content (no-code CMS)
// ---------------------------------------------------------------------------

/**
 * Save one content override. Validated against the registry, then the
 * affected marketing routes are revalidated so the edit goes live
 * immediately — no redeploy.
 */
export async function saveSiteContent(
  key: string,
  rawValue: unknown,
): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  const rl = await rateLimit(
    `studio-content:${admin.id}`,
    limits.mutation.max,
    limits.mutation.windowMs,
  );
  if (!rl.allowed) return rateLimitError(rl.resetIn);

  const def = getContentDef(key);
  if (!def) return { error: "Unknown content key." };

  const checked = validateContentValue(def, rawValue);
  if (!checked.ok) return { error: checked.error };

  const svc = await createServiceClient();
  const { error } = await svc.from("site_content").upsert(
    { key, value: checked.value, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  if (error) return { error: "Couldn't save — try again." };

  // Purge the cached CMS fetch, then refresh the affected HTML routes.
  updateTag("site-content");
  for (const p of def.paths) revalidatePath(p);
  return { ok: true };
}

/** Remove an override so the registry default renders again. */
export async function resetSiteContent(key: string): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  const rl = await rateLimit(
    `studio-content:${admin.id}`,
    limits.mutation.max,
    limits.mutation.windowMs,
  );
  if (!rl.allowed) return rateLimitError(rl.resetIn);

  const def = getContentDef(key);
  if (!def) return { error: "Unknown content key." };

  const svc = await createServiceClient();
  const { error } = await svc.from("site_content").delete().eq("key", key);
  if (error) return { error: "Couldn't reset — try again." };

  updateTag("site-content");
  for (const p of def.paths) revalidatePath(p);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------

const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(120),
  email: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.string().email("Enter a valid email").max(200).optional()),
  phone: z.string().trim().max(40).optional(),
  company_name: z.string().trim().max(120).optional(),
  source: z.enum(["manual", "contact_form", "trial", "import"]).default("manual"),
  stage: z.enum(["new", "contacted", "trial", "customer", "lost"]).default("new"),
  deal_value_cents: z.number().int().min(0).max(100_000_000).nullable().optional(),
  notes: z.string().trim().max(5000).optional(),
});

function emptyToNull<T>(v: T | undefined): T | null {
  return v === undefined || v === "" ? null : v;
}

export async function createCrmContact(
  input: unknown,
): Promise<ActionResult & { id?: string }> {
  await requirePlatformAdmin();
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const d = parsed.data;
  const svc = await createServiceClient();
  const { data, error } = await svc
    .from("crm_contacts")
    .insert({
      name: d.name,
      email: emptyToNull(d.email),
      phone: emptyToNull(d.phone),
      company_name: emptyToNull(d.company_name),
      source: d.source,
      stage: d.stage,
      deal_value_cents: d.deal_value_cents ?? null,
      notes: emptyToNull(d.notes),
    })
    .select("id")
    .single();
  if (error || !data) {
    // 42P01 = undefined_table: migration 0009_studio.sql was never run.
    if (error && (error as { code?: string }).code === "42P01") {
      return {
        error:
          "The CRM database tables aren't set up yet. Run supabase/migrations/0009_studio.sql in your Supabase SQL editor, then try again.",
      };
    }
    return { error: "Couldn't create the contact." };
  }
  revalidatePath("/studio/crm");
  revalidatePath("/studio");
  return { ok: true, id: data.id };
}

export async function updateCrmContact(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  const parsed = contactSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const svc = await createServiceClient();
  const { data: existing } = await svc
    .from("crm_contacts")
    .select("stage")
    .eq("id", id)
    .single();
  if (!existing) return { error: "Contact not found." };

  const d = parsed.data;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (d.name !== undefined) patch.name = d.name;
  if (d.email !== undefined) patch.email = emptyToNull(d.email);
  if (d.phone !== undefined) patch.phone = emptyToNull(d.phone);
  if (d.company_name !== undefined) patch.company_name = emptyToNull(d.company_name);
  if (d.source !== undefined) patch.source = d.source;
  if (d.stage !== undefined) patch.stage = d.stage;
  if (d.deal_value_cents !== undefined)
    patch.deal_value_cents = d.deal_value_cents ?? null;
  if (d.notes !== undefined) patch.notes = emptyToNull(d.notes);

  const { error } = await svc.from("crm_contacts").update(patch).eq("id", id);
  if (error) return { error: "Couldn't save the contact." };

  // Log stage moves on the timeline automatically.
  if (d.stage && d.stage !== (existing as { stage: string }).stage) {
    await svc.from("crm_activities").insert({
      contact_id: id,
      kind: "stage_change",
      body: `Moved to ${crmStageLabel(d.stage)}`,
      created_by_email: admin.email ?? null,
    });
  }
  revalidatePath("/studio/crm");
  revalidatePath(`/studio/crm/${id}`);
  revalidatePath("/studio");
  return { ok: true };
}

export async function deleteCrmContact(id: string): Promise<ActionResult> {
  await requirePlatformAdmin();
  const svc = await createServiceClient();
  const { error } = await svc.from("crm_contacts").delete().eq("id", id);
  if (error) return { error: "Couldn't delete the contact." };
  revalidatePath("/studio/crm");
  revalidatePath("/studio");
  return { ok: true };
}

const activitySchema = z.object({
  kind: z.string().refine(isCrmActivityKind, "Pick a valid activity type."),
  body: z.string().trim().min(1, "Write something first.").max(5000),
});

export async function addCrmActivity(
  contactId: string,
  input: unknown,
): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  const parsed = activitySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const svc = await createServiceClient();
  const { data: contact } = await svc
    .from("crm_contacts")
    .select("id")
    .eq("id", contactId)
    .single();
  if (!contact) return { error: "Contact not found." };

  const { error } = await svc.from("crm_activities").insert({
    contact_id: contactId,
    kind: parsed.data.kind,
    body: parsed.data.body,
    created_by_email: admin.email ?? null,
  });
  if (error) return { error: "Couldn't add the note." };
  await svc
    .from("crm_contacts")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", contactId);
  revalidatePath(`/studio/crm/${contactId}`);
  revalidatePath("/studio/crm");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Public trial-request capture (the /demo form) → CRM lead
// ---------------------------------------------------------------------------

const trialSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120),
  company: z.string().trim().min(1, "Enter your company name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(200),
  phone: z.string().trim().max(40).optional(),
});

/**
 * The "Start free trial" form. Rate-limited, validated, and stored as a CRM
 * lead (source=trial) so the founder sees every request in Studio. The owner
 * also gets an email — but the lead is saved even if email isn't configured.
 */
export async function captureTrialLead(
  formData: FormData,
): Promise<ActionResult> {
  const rl = await rateLimit("trial-lead", limits.spammy.max, limits.spammy.windowMs);
  if (!rl.allowed) return rateLimitError(rl.resetIn);

  const parsed = trialSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { name, company, email, phone } = parsed.data;

  try {
    const svc = await createServiceClient();
    // One lead per email — refresh the existing one instead of duplicating.
    const { data: existing } = await svc
      .from("crm_contacts")
      .select("id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();
    if (existing) {
      await svc
        .from("crm_contacts")
        .update({
          name,
          company_name: company,
          phone: phone?.trim() ? phone.trim() : null,
          source: "trial",
          updated_at: new Date().toISOString(),
        })
        .eq("id", (existing as { id: string }).id);
    } else {
      await svc.from("crm_contacts").insert({
        name,
        email,
        phone: phone?.trim() ? phone.trim() : null,
        company_name: company,
        source: "trial",
        stage: "new",
      });
    }
  } catch {
    return { error: "Something went wrong — please try again." };
  }

  // Best-effort owner notification; the lead is already saved.
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "TidyPro <hello@tidypro.example>",
        to: process.env.CONTACT_EMAIL ?? "azizdemir6@gmail.com",
        replyTo: email,
        subject: `New trial request: ${company} (${name})`,
        text: [
          `Name: ${name}`,
          `Company: ${company}`,
          `Email: ${email}`,
          phone?.trim() ? `Phone: ${phone.trim()}` : null,
          "",
          "View in Studio → /studio/crm",
        ]
          .filter(Boolean)
          .join("\n"),
      });
    }
  } catch {
    // Notification failure never blocks the signup.
  }
  return { ok: true };
}

/**
 * Contact-form submissions also become CRM leads (source=contact_form).
 * Called from sendContactMessage — failures never block the email.
 */
export async function recordContactFormLead(input: {
  name: string;
  email: string;
  company?: string;
  message: string;
}): Promise<void> {
  try {
    const svc = await createServiceClient();
    const { data: existing } = await svc
      .from("crm_contacts")
      .select("id")
      .eq("email", input.email)
      .limit(1)
      .maybeSingle();
    if (existing) return; // already tracked — the email thread continues it
    await svc.from("crm_contacts").insert({
      name: input.name,
      email: input.email,
      company_name: input.company?.trim() ? input.company.trim() : null,
      source: "contact_form",
      stage: "new",
      notes: input.message.slice(0, 2000),
    });
  } catch {
    // CRM capture must never break the contact form.
  }
}

// ---------------------------------------------------------------------------
// Studio user management (platform admin only)
// ---------------------------------------------------------------------------

const studioEmailSchema = z.string().trim().email("Enter a valid email").max(200);
const studioRoleSchema = z.enum(["owner", "manager", "cleaner"]);
const studioIdSchema = z.string().uuid("Invalid id");

/** Change a member's role within their company. */
export async function studioUpdateUserRole(
  membershipId: string,
  role: string,
): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  const rl = await rateLimit(
    `studio-users:${admin.id}`,
    limits.mutation.max,
    limits.mutation.windowMs,
  );
  if (!rl.allowed) return rateLimitError(rl.resetIn);
  if (!studioIdSchema.safeParse(membershipId).success) return { error: "Invalid user." };
  const parsedRole = studioRoleSchema.safeParse(role);
  if (!parsedRole.success) return { error: "Invalid role." };
  const { setStudioUserRole } = await import("./users");
  const res = await setStudioUserRole(membershipId, parsedRole.data);
  if ("error" in res) return { error: res.error };
  revalidatePath("/studio/users");
  return { ok: true };
}

/** Change a user's login email (auth account + memberships). */
export async function studioUpdateUserEmail(
  userId: string,
  email: string,
): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  const rl = await rateLimit(
    `studio-users:${admin.id}`,
    limits.mutation.max,
    limits.mutation.windowMs,
  );
  if (!rl.allowed) return rateLimitError(rl.resetIn);
  if (!studioIdSchema.safeParse(userId).success) return { error: "Invalid user." };
  const parsedEmail = studioEmailSchema.safeParse(email);
  if (!parsedEmail.success) {
    return { error: parsedEmail.error.issues[0]?.message ?? "Invalid email." };
  }
  const { setStudioUserEmail } = await import("./users");
  const res = await setStudioUserEmail(userId, parsedEmail.data);
  if ("error" in res) return { error: res.error };
  revalidatePath("/studio/users");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Studio subscription-tier management (platform admin only)
// ---------------------------------------------------------------------------

const studioTierSchema = z.object({
  companyId: z.string().uuid("Invalid company."),
  tier: z.enum(["essential", "complete"]),
});

export type TierChangeResult = ActionResult & {
  previousTier?: string;
  newTier?: string;
};

/**
 * Change a company's subscription tier and record it in the audit log.
 * Works for any company, including the acting admin's own — an explicit
 * change overrides the founder all-access grant for that company.
 * Permission is enforced here on the backend (requirePlatformAdmin),
 * never just in the UI.
 */
export async function studioSetCompanyTier(
  companyId: string,
  tier: string,
): Promise<TierChangeResult> {
  const admin = await requirePlatformAdmin();
  const rl = await rateLimit(
    `studio-tiers:${admin.id}`,
    limits.mutation.max,
    limits.mutation.windowMs,
  );
  if (!rl.allowed) return rateLimitError(rl.resetIn);
  const parsed = studioTierSchema.safeParse({ companyId, tier });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { setCompanyTier } = await import("./tiers");
  const res = await setCompanyTier(parsed.data.companyId, parsed.data.tier);
  if ("error" in res) return { error: res.error };
  revalidatePath("/studio/tiers");
  revalidatePath("/studio");
  return { ok: true, previousTier: res.previousTier, newTier: res.newTier };
}

/** Delete a user entirely (memberships + login). Cannot delete yourself. */
export async function studioDeleteUser(userId: string): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  const rl = await rateLimit(
    `studio-users:${admin.id}`,
    limits.mutation.max,
    limits.mutation.windowMs,
  );
  if (!rl.allowed) return rateLimitError(rl.resetIn);
  if (!studioIdSchema.safeParse(userId).success) return { error: "Invalid user." };
  const { deleteStudioUser } = await import("./users");
  const res = await deleteStudioUser(userId);
  if ("error" in res) return { error: res.error };
  revalidatePath("/studio/users");
  revalidatePath("/studio");
  return { ok: true };
}
