/**
 * Outgoing integration webhooks (server-only).
 *
 * These are plain HTTP POST webhooks — no partnership or API key needed.
 * The user creates a "Catch Hook" trigger in Zapier (Webhooks by Zapier),
 * or the equivalent in Make/n8n, and pastes the unique URL into TidyPro.
 * We POST `{ event, occurred_at, data }` JSON to every active webhook
 * subscribed to the event.
 *
 * fireIntegrationEvent() NEVER throws to its caller: a missing migration,
 * a bad URL, or a failing endpoint must never break the booking/job/
 * payment flow that triggered the event.
 */

import { decryptToken } from "@/lib/import/encryption";
import { createServiceClient } from "@/lib/supabase/server";

export const EVENT_CATALOG = [
  { event: "booking.created", descriptionKey: "events.bookingCreated" },
  { event: "booking.cancelled", descriptionKey: "events.bookingCancelled" },
  { event: "quote.approved", descriptionKey: "events.quoteApproved" },
  { event: "job.completed", descriptionKey: "events.jobCompleted" },
  { event: "invoice.paid", descriptionKey: "events.invoicePaid" },
  { event: "customer.created", descriptionKey: "events.customerCreated" },
] as const;

export type IntegrationEvent = (typeof EVENT_CATALOG)[number]["event"];

export const EVENT_NAMES = new Set<string>(EVENT_CATALOG.map((e) => e.event));

const POST_TIMEOUT_MS = 8_000;

type WebhookRow = {
  id: string;
  url_enc: string;
  events: string[] | null;
};

/**
 * Deliver an event to every active webhook subscribed to it.
 * Fire-and-forget from the caller's perspective: always resolves, never throws.
 */
export async function fireIntegrationEvent(
  companyId: string,
  event: IntegrationEvent,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = await createServiceClient();
    const { data: hooks, error } = await supabase
      .from("integration_webhooks")
      .select("id, url_enc, events")
      .eq("company_id", companyId)
      .eq("active", true);
    if (error) return; // Missing table or RLS: stay silent, main flow continues.
    const matches = ((hooks ?? []) as WebhookRow[]).filter((h) =>
      (h.events ?? []).includes(event),
    );
    if (matches.length === 0) return;

    const payload = JSON.stringify({
      event,
      occurred_at: new Date().toISOString(),
      data,
    });

    await Promise.allSettled(
      matches.map(async (hook) => {
        const url = decryptToken(hook.url_enc);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            signal: controller.signal,
          });
          if (res.ok) {
            await supabase
              .from("integration_webhooks")
              .update({ last_triggered_at: new Date().toISOString() })
              .eq("id", hook.id);
          }
        } finally {
          clearTimeout(timer);
        }
      }),
    );
  } catch {
    // Never bubble up to the booking/job/payment flow.
  }
}
