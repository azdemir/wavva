import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  renderCommunicationTemplate,
  renderSmsTemplate,
  type TemplateKey,
} from "@/lib/communications/templates";
import {
  getTemplateOverrides,
  resolveTemplate,
  rowKey,
  type TemplateOverrideRow,
} from "@/lib/communications/overrides";
import { senderFor } from "./sender";
import { isSmsConfigured, sendSms } from "./sms";

let resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

type QueuedNotification = {
  id: string;
  company_id: string;
  channel: string;
  template: string;
  payload: Record<string, unknown>;
  // Supabase types the to-one join as an array; normalize at runtime.
  companies:
    | { name: string; email: string | null }
    | { name: string; email: string | null }[]
    | null;
};

/**
 * Send up to `limit` queued notifications, email and SMS.
 *
 * Per-company template overrides (Settings → Communications) are respected:
 * a disabled template marks its rows "skipped". SMS rows stay queued
 * (counted as skipped) until Twilio is configured, so enabling the provider
 * later delivers the backlog.
 */
export async function processNotificationQueue(
  supabase: SupabaseClient,
  limit = 25,
): Promise<{ sent: number; failed: number; skipped: number }> {
  const resendClient = getResend();

  const { data } = await supabase
    .from("notifications")
    .select("id, company_id, channel, template, payload, companies(name, email)")
    .eq("status", "queued")
    .in("channel", ["email", "sms"])
    .order("created_at", { ascending: true })
    .limit(limit);

  // One override lookup per company per run.
  const overridesCache = new Map<string, Map<string, TemplateOverrideRow>>();
  async function overridesFor(companyId: string) {
    let m = overridesCache.get(companyId);
    if (!m) {
      m = await getTemplateOverrides(supabase, companyId);
      overridesCache.set(companyId, m);
    }
    return m;
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const n of (data ?? []) as QueuedNotification[]) {
    const key = n.template as TemplateKey;
    const channel = n.channel as "email" | "sms";
    const overrides = await overridesFor(n.company_id);
    const resolved = resolveTemplate(key, channel, overrides.get(rowKey(key, channel)));
    const override = resolved.customized
      ? { subject: resolved.subject || null, body: resolved.body || null }
      : null;

    if (!resolved.enabled) {
      await supabase.from("notifications").update({ status: "skipped" }).eq("id", n.id);
      skipped++;
      continue;
    }

    if (channel === "email") {
      if (!resendClient) {
        skipped++;
        continue;
      }
      const email = String(n.payload.email ?? "");
      if (!email) {
        await supabase.from("notifications").update({ status: "failed" }).eq("id", n.id);
        failed++;
        continue;
      }
      // From the business's email so the customer sees the company, not the platform.
      const joined = n.companies;
      const company = Array.isArray(joined) ? joined[0] : joined;
      const from = senderFor(company ?? { name: "", email: null });
      try {
        const { subject, html, text } = renderCommunicationTemplate(key, n.payload, override);
        const { error } = await resendClient.emails.send({
          from,
          to: email,
          subject,
          html,
          text,
        });
        if (error) throw new Error(error.message);
        await supabase
          .from("notifications")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", n.id);
        sent++;
      } catch {
        await supabase.from("notifications").update({ status: "failed" }).eq("id", n.id);
        failed++;
      }
      continue;
    }

    // channel === "sms"
    if (!isSmsConfigured()) {
      // No provider yet — stay queued so they send once Twilio is configured.
      skipped++;
      continue;
    }
    const phone = String(n.payload.phone ?? "");
    if (!phone) {
      await supabase.from("notifications").update({ status: "failed" }).eq("id", n.id);
      failed++;
      continue;
    }
    try {
      const text = renderSmsTemplate(key, n.payload, override ? { body: override.body } : null);
      await sendSms(phone, text);
      await supabase
        .from("notifications")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", n.id);
      sent++;
    } catch {
      await supabase.from("notifications").update({ status: "failed" }).eq("id", n.id);
      failed++;
    }
  }
  return { sent, failed, skipped };
}
