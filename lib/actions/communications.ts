"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  TEMPLATE_DEFINITIONS,
  type CommunicationChannel,
  type TemplateKey,
} from "@/lib/communications/templates";
import { getTemplateOverrides, resolveTemplate, rowKey } from "@/lib/communications/overrides";

export interface TemplateView {
  key: TemplateKey;
  audience: "customer" | "cleaner";
  label: string;
  description: string;
  channels: CommunicationChannel[];
  variables: string[];
  /** Effective values (override wins over default). */
  emailSubject: string;
  emailBody: string;
  smsBody: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailCustomized: boolean;
  smsCustomized: boolean;
  /** Code defaults (for "reset to default"). */
  defaultEmailSubject: string;
  defaultEmailBody: string;
  defaultSmsBody: string;
}

const ALL_KEYS = new Set<string>(TEMPLATE_DEFINITIONS.map((d) => d.key));

/** Owner-only: every template with this company's overrides merged in. */
export async function getCommunicationTemplates(): Promise<TemplateView[]> {
  const { company } = await requireOwner();
  const supabase = await createClient();
  const overrides = await getTemplateOverrides(supabase, company.id);
  return TEMPLATE_DEFINITIONS.map((def) => {
    const email = resolveTemplate(def.key, "email", overrides.get(rowKey(def.key, "email")));
    const sms = resolveTemplate(def.key, "sms", overrides.get(rowKey(def.key, "sms")));
    return {
      key: def.key,
      audience: def.audience,
      label: def.label,
      description: def.description,
      channels: def.channels,
      variables: def.variables,
      emailSubject: email.subject,
      emailBody: email.body,
      smsBody: sms.body,
      emailEnabled: email.enabled,
      smsEnabled: sms.enabled,
      emailCustomized: email.customized,
      smsCustomized: sms.customized,
      defaultEmailSubject: def.emailSubject,
      defaultEmailBody: def.emailBody,
      defaultSmsBody: def.smsBody,
    };
  });
}

const saveSchema = z.object({
  key: z.string().refine((k) => ALL_KEYS.has(k), "Unknown template"),
  channel: z.enum(["email", "sms"]),
  subject: z.string().max(200).optional(),
  body: z.string().max(20000).optional(),
  enabled: z.boolean(),
});

/** Owner-only: upsert a per-company template override. */
export async function saveTemplateOverride(
  input: unknown,
): Promise<{ ok?: boolean; error?: string }> {
  const { company } = await requireOwner();
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid template data." };
  const { key, channel, subject, body, enabled } = parsed.data;
  if (channel === "sms" && (body?.length ?? 0) > 1000) {
    return { error: "SMS text must be 1,000 characters or less." };
  }
  if (channel === "email" && !subject?.trim()) {
    return { error: "Email subject cannot be empty." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("communication_templates").upsert(
    {
      company_id: company.id,
      template_key: key,
      channel,
      subject: channel === "email" ? subject?.trim() || null : null,
      body: body?.trim() || null,
      enabled,
    },
    { onConflict: "company_id,template_key,channel" },
  );
  if (error) {
    // Most likely the table doesn't exist yet (migration 0011 not run).
    return {
      error:
        "Could not save. Run supabase/migrations/0011_communication_templates.sql in your Supabase project first.",
    };
  }
  revalidatePath("/dashboard/settings/communications");
  return { ok: true };
}

/** Owner-only: delete the override → the code default applies again. */
export async function resetTemplateOverride(
  key: string,
  channel: CommunicationChannel,
): Promise<{ ok?: boolean; error?: string }> {
  const { company } = await requireOwner();
  if (!ALL_KEYS.has(key) || (channel !== "email" && channel !== "sms")) {
    return { error: "Invalid template." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("communication_templates")
    .delete()
    .eq("company_id", company.id)
    .eq("template_key", key)
    .eq("channel", channel);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/settings/communications");
  return { ok: true };
}
