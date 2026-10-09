import type { SupabaseClient } from "@supabase/supabase-js";
// Typed against the shared catalog in lib/communications, not the legacy
// ./templates union. `send.ts` already renders through resolveTemplate(),
// so the queue has to accept the same keys. The old TemplateName union is a
// strict subset of TemplateKey, so every existing caller keeps compiling.
import type { TemplateKey } from "@/lib/communications/templates";

export type EnqueueInput = {
  company_id: string;
  /** 'customer' → recipient_id is a customer id; 'user' → a Supabase user id. */
  recipient_type: "customer" | "user";
  recipient_id: string;
  channel: "email" | "sms";
  template: TemplateKey;
  /** Must include `email` (for email) so the sender doesn't need extra lookups. */
  payload: Record<string, unknown>;
};

/**
 * Queue a notification. Delivery happens asynchronously via the cron
 * endpoint (`/api/cron/notifications`), so actions stay fast and a missing
 * email provider never breaks the user's workflow.
 */
export async function enqueueNotification(
  supabase: SupabaseClient,
  input: EnqueueInput,
): Promise<void> {
  try {
    await supabase.from("notifications").insert({
      company_id: input.company_id,
      recipient_type: input.recipient_type,
      recipient_id: input.recipient_id,
      channel: input.channel,
      template: input.template,
      payload: input.payload,
      status: "queued",
    });
  } catch {
    // Notifications must never break the user's action.
  }
}
