/**
 * Per-company template overrides (table `communication_templates`,
 * migration 0011). Only overrides are stored — defaults live in
 * `lib/communications/templates.ts`, so improving a default propagates to
 * every company that hasn't customized that template.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getTemplateDefinition,
  type CommunicationChannel,
  type TemplateKey,
} from "./templates";

export interface TemplateOverrideRow {
  template_key: string;
  channel: string;
  subject: string | null;
  body: string | null;
  enabled: boolean;
}

export interface ResolvedTemplate {
  /** Email subject ("" for the SMS channel). */
  subject: string;
  /** Email HTML body, or plain-text SMS body, after override merging. */
  body: string;
  enabled: boolean;
  /** True when the company customized this template/channel. */
  customized: boolean;
}

function rowKey(key: TemplateKey, channel: CommunicationChannel): string {
  return `${key}:${channel}`;
}

/** Load all overrides for a company (one query; callers cache the map). */
export async function getTemplateOverrides(
  supabase: SupabaseClient,
  companyId: string,
): Promise<Map<string, TemplateOverrideRow>> {
  const map = new Map<string, TemplateOverrideRow>();
  try {
    const { data } = await supabase
      .from("communication_templates")
      .select("template_key, channel, subject, body, enabled")
      .eq("company_id", companyId);
    for (const r of (data ?? []) as TemplateOverrideRow[]) {
      map.set(`${r.template_key}:${r.channel}`, r);
    }
  } catch {
    // Table may not exist yet (migration 0011 not run) — fall back to defaults.
  }
  return map;
}

/**
 * Merge a company's override with the code default. For email the body is
 * HTML; for SMS it's plain text. Subject only applies to email.
 */
export function resolveTemplate(
  key: TemplateKey,
  channel: CommunicationChannel,
  override?: TemplateOverrideRow | null,
): ResolvedTemplate {
  const def = getTemplateDefinition(key);
  if (!override) {
    return {
      subject: channel === "email" ? def.emailSubject : "",
      body: channel === "email" ? def.emailBody : def.smsBody,
      enabled: true,
      customized: false,
    };
  }
  return {
    subject: channel === "email" ? override.subject || def.emailSubject : "",
    body: override.body || (channel === "email" ? def.emailBody : def.smsBody),
    enabled: override.enabled,
    customized: true,
  };
}

export { rowKey };
