/**
 * Fan-out helper: enqueue a template on every channel we have contact info
 * for. Email needs an address; SMS needs a phone number plus consent
 * (customers opt in via the "SMS reminders" checkbox on their profile;
 * team members are covered by their employment relationship, so a phone
 * number on file is enough).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { enqueueNotification } from "@/lib/notifications/queue";
import { supportsChannel, type TemplateKey } from "./templates";

export interface NotifyContact {
  email?: string | null;
  phone?: string | null;
  /** Required for customer SMS; team SMS only needs a phone number. */
  smsConsent?: boolean;
}

export async function enqueueCustomerNotification(
  supabase: SupabaseClient,
  args: {
    company_id: string;
    recipient_type: "customer" | "user";
    recipient_id: string;
    template: TemplateKey;
    /** Base payload; `email`/`phone` are added per channel. */
    payload: Record<string, unknown>;
    contact: NotifyContact;
    /** Skip the consent gate (e.g. staff recipients). */
    skipConsentCheck?: boolean;
  },
): Promise<void> {
  const { company_id, recipient_type, recipient_id, template, payload, contact } = args;
  const jobs: Promise<void>[] = [];
  if (supportsChannel(template, "email") && contact.email) {
    jobs.push(
      enqueueNotification(supabase, {
        company_id,
        recipient_type,
        recipient_id,
        channel: "email",
        template,
        payload: { ...payload, email: contact.email },
      }),
    );
  }
  const consented = args.skipConsentCheck || contact.smsConsent;
  if (supportsChannel(template, "sms") && contact.phone && consented) {
    jobs.push(
      enqueueNotification(supabase, {
        company_id,
        recipient_type,
        recipient_id,
        channel: "sms",
        template,
        payload: { ...payload, phone: contact.phone },
      }),
    );
  }
  await Promise.all(jobs);
}
