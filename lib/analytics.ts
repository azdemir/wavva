"use client";

/**
 * Basic first-party analytics for the Front Office marketing surface.
 * track(event, props) POSTs to /api/analytics/event; failures are silent
 * so analytics can never break the page.
 */

export type AnalyticsEvent =
  | { event: "cta_click"; props: { cta: string; page: string } }
  | { event: "application_submit"; props: { plan: string } }
  | { event: "wizard_complete"; props: { company_id: string } };

export function track(event: AnalyticsEvent["event"], props: Record<string, string> = {}) {
  try {
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, props }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Analytics must never throw.
  }
}
