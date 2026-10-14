import type { SupabaseClient } from "@supabase/supabase-js";
import { isHelpMessage, isStartMessage, isStopMessage } from "./providers/sms";

/**
 * Front Office compliance rules, enforced in code.
 *
 * 1. Consent: per-customer SMS/email consent with timestamp + source is
 *    stored on customers. Follow-ups NEVER go to customers without consent.
 *    STOP / unsubscribe is honored immediately.
 * 2. Disclosure: every answered call opens with the AI disclosure line plus
 *    a call-recording notice.
 * 3. No outbound automated sales calls: there is no code path for them —
 *    the VoiceProvider interface only handles inbound calls, and follow-ups
 *    are text/email only.
 * 4. Price-list guard: the assistant may ONLY quote from the company's
 *    price list. Anything else becomes an escalation for the owner.
 * 5. Quiet hours: outbound texts only between 08:00–21:00 company-local
 *    (defaults), otherwise queued.
 */

/** Spoken first on every answered call — callers always know it's the AI. */
export function AI_DISCLOSURE_LINE(companyName: string): string {
  return `Hi, thanks for calling ${companyName} — you're speaking with ${companyName}'s AI assistant.`;
}

/** Spoken right after the disclosure on every answered call. */
export const CALL_RECORDING_DISCLOSURE =
  "This call may be recorded for quality and training purposes.";

/**
 * No outbound automated sales calls. This is structural, not just a
 * comment: the VoiceProvider interface exposes only inbound handling, and
 * this module exports no dial/outbound-call helper. If you need to add
 * one, the offer forbids it — get explicit owner direction first.
 */
export const NO_OUTBOUND_SALES_CALLS = true as const;

export type ConsentChannel = "sms" | "email";

export type CustomerConsent = {
  sms_consent: boolean | null;
  email_consent: boolean | null;
};

/** True when the customer may receive follow-ups on this channel. */
export function canFollowUp(customer: CustomerConsent, channel: ConsentChannel): boolean {
  return channel === "sms"
    ? customer.sms_consent === true
    : customer.email_consent === true;
}

/**
 * Record consent (e.g. from the setup CSV, a web form, or a verbal "yes"
 * logged by the assistant). Always stamps time + source.
 */
export async function recordConsent(
  supabase: SupabaseClient,
  customerId: string,
  channel: ConsentChannel,
  source: string,
): Promise<void> {
  const now = new Date().toISOString();
  await supabase
    .from("customers")
    .update(
      channel === "sms"
        ? { sms_consent: true, sms_consent_at: now, sms_consent_source: source }
        : { email_consent: true, email_consent_at: now, email_consent_source: source },
    )
    .eq("id", customerId);
}

/**
 * Honor an opt-out IMMEDIATELY: clears consent, stamps the revocation, and
 * returns true. Call this for STOP (sms) or unsubscribe (email) before
 * doing anything else with the message.
 */
export async function revokeConsent(
  supabase: SupabaseClient,
  customerId: string,
  channel: ConsentChannel,
  source: string,
): Promise<void> {
  const now = new Date().toISOString();
  await supabase
    .from("customers")
    .update(
      channel === "sms"
        ? {
            sms_consent: false,
            sms_consent_at: now,
            sms_consent_source: `revoked:${source}`,
          }
        : {
            email_consent: false,
            email_consent_at: now,
            email_consent_source: `revoked:${source}`,
          },
    )
    .eq("id", customerId);
}

/**
 * Standard STOP confirmation, sent once immediately after an opt-out.
 * CTIA requires this reply even though no further texts may follow — it
 * must go out right away and must NOT be held for quiet hours.
 */
export function STOP_CONFIRMATION_MESSAGE(companyName: string): string {
  return `You're unsubscribed from ${companyName} texts and won't receive more. Reply START to re-subscribe.`;
}

/** Confirmation for a START re-subscribe (consent re-stamped, opt-in flow). */
export function START_CONFIRMATION_MESSAGE(companyName: string): string {
  return `You're re-subscribed to ${companyName} texts. Reply STOP to unsubscribe.`;
}

/**
 * Standard HELP reply, sent once in response to HELP.
 * businessLine is the company's real line (front_office_settings.business_line).
 */
export function HELP_MESSAGE(companyName: string, businessLine?: string): string {
  const callBit = businessLine
    ? ` or call ${businessLine}`
    : "";
  return `${companyName}: text questions to this number${callBit}. Reply STOP to unsubscribe.`;
}

export type InboundSmsHandling =
  | { handled: false; kind: null; reply: null }
  | { handled: true; kind: "stop" | "start" | "help"; reply: string };

export type InboundSmsCompany = {
  /** companies.name — used in the reply copy. */
  name: string;
  /** front_office_settings.business_line — used in the HELP reply. */
  businessLine?: string;
};

/**
 * Inbound SMS triage: detect STOP / START / HELP and act on the spot.
 *
 * - STOP: revoke consent immediately, return the one standard confirmation
 *   (caller must send it right away — NOT queued for quiet hours — and send
 *   nothing else afterwards).
 * - START: re-record consent (timestamp + source stamped) and confirm.
 * - HELP: return the standard help reply; consent state is unchanged.
 * - Anything else: unhandled — route to the assistant/escalation path.
 *
 * Returns the exact reply the caller must send; null when nothing is owed.
 */
export async function handleInboundSms(
  supabase: SupabaseClient,
  customerId: string,
  body: string,
  company: InboundSmsCompany,
): Promise<InboundSmsHandling> {
  if (isStopMessage(body)) {
    await revokeConsent(supabase, customerId, "sms", "inbound_stop");
    return {
      handled: true,
      kind: "stop",
      reply: STOP_CONFIRMATION_MESSAGE(company.name),
    };
  }
  if (isStartMessage(body)) {
    await recordConsent(supabase, customerId, "sms", "inbound_start");
    return {
      handled: true,
      kind: "start",
      reply: START_CONFIRMATION_MESSAGE(company.name),
    };
  }
  if (isHelpMessage(body)) {
    return {
      handled: true,
      kind: "help",
      reply: HELP_MESSAGE(company.name, company.businessLine),
    };
  }
  return { handled: false, kind: null, reply: null };
}

/** Hour (0–23) in a timezone, for quiet-hours math. */
function hourInTimezone(now: Date, timezone: string): number {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).format(now),
  );
  return hour === 24 ? 0 : hour;
}

/** True when `now` falls inside the company's quiet-hours window. */
export function isWithinQuietHours(
  now: Date,
  timezone: string,
  start = "08:00",
  end = "21:00",
): boolean {
  const hour = hourInTimezone(now, timezone);
  const startH = Number(start.split(":")[0]);
  const endH = Number(end.split(":")[0]);
  // Default window 08:00–21:00 never wraps midnight; handle wrap anyway.
  if (startH <= endH) return hour >= startH && hour < endH;
  return hour >= startH || hour < endH;
}

export type TextSendDecision = { allowed: boolean; retryAt?: Date };

/**
 * Gate for every outbound assistant text: allowed only inside quiet hours.
 * Outside hours the message must be queued — compute the next 08:00 local
 * as the retry time.
 */
export function textSendDecision(
  now: Date,
  timezone: string,
  quietStart = "08:00",
  quietEnd = "21:00",
): TextSendDecision {
  if (isWithinQuietHours(now, timezone, quietStart, quietEnd)) {
    return { allowed: true };
  }
  // Next 08:00 in the company timezone. Computing an exact instant across
  // DST needs a tz library; scheduling "next local 08:00" via the cron
  // hourly tick is the pragmatic path — return now+1h as the recheck time.
  return { allowed: false, retryAt: new Date(now.getTime() + 3600_000) };
}

export type PriceListItem = { name: string; price_cents: number; unit: string };

/**
 * Price-list guard: find a service in the company's price list by name
 * (case-insensitive, trimmed). Returns null when there is no match — the
 * caller MUST escalate to the owner instead of quoting.
 */
export function quoteFromPriceList(
  serviceName: string,
  priceList: PriceListItem[],
): PriceListItem | null {
  const needle = serviceName.trim().toLowerCase();
  if (!needle) return null;
  return (
    priceList.find((item) => item.name.trim().toLowerCase() === needle) ?? null
  );
}

/**
 * Build the escalation row for a quote the assistant may not give: either
 * no price-list match, or a request that breaks the company's rules.
 * Insert into front_office_escalations with kind 'off_price_quote'.
 */
export function buildOffPriceEscalation(input: {
  companyId: string;
  customerName: string;
  requestedService: string;
  reason: string;
}): {
  company_id: string;
  kind: "off_price_quote";
  title: string;
  detail: string;
  payload: Record<string, unknown>;
} {
  return {
    company_id: input.companyId,
    kind: "off_price_quote",
    title: `Quote request outside the price list — ${input.customerName}`,
    detail: `The customer asked about "${input.requestedService}". ${input.reason} It needs your OK before anyone quotes a price.`,
    payload: {
      requested_service: input.requestedService,
      customer_name: input.customerName,
    },
  };
}
