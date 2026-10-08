import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { renderTemplate, type TemplateName } from "./templates";

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
};

/**
 * Send up to `limit` queued notifications. Email only for now —
 * SMS rows stay queued until an SMS provider is configured.
 */
export async function processNotificationQueue(
  supabase: SupabaseClient,
  limit = 25,
): Promise<{ sent: number; failed: number; skipped: number }> {
  const resendClient = getResend();
  const from = process.env.EMAIL_FROM ?? "TidyPro <hello@tidypro.example>";

  const { data } = await supabase
    .from("notifications")
    .select("id, company_id, channel, template, payload")
    .eq("status", "queued")
    .eq("channel", "email")
    .order("created_at", { ascending: true })
    .limit(limit);

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const n of (data ?? []) as QueuedNotification[]) {
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
    try {
      const { subject, html, text } = renderTemplate(
        n.template as TemplateName,
        n.payload as Record<string, string | number | undefined>,
      );
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
  }
  return { sent, failed, skipped };
}
