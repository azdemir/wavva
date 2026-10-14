/**
 * SMS provider interface (Twilio).
 *
 * Compliance is enforced by the CALLER (see compliance.ts), not the
 * provider: every send must pass a consent check, a quiet-hours check, and
 * STOP handling first. This interface only moves the bytes.
 */

export type OutboundSms = {
  to: string;
  body: string;
  companyId: string;
  /** Optional: links the message to the conversation log. */
  customerId?: string;
};

export type InboundSms = {
  from: string;
  to: string;
  body: string;
  providerMessageId: string;
  receivedAt: Date;
};

export interface SmsProvider {
  readonly name: string;
  /** Send one SMS. Caller must have verified consent + quiet hours. */
  sendSms(sms: OutboundSms): Promise<{ messageId: string }>;
  /**
   * Normalize a provider webhook payload into an InboundSms.
   * Throws on malformed payloads.
   */
  parseInboundWebhook(payload: unknown): InboundSms;
}

/**
 * Opt-out keywords (case-insensitive, per CTIA guidance). Any inbound SMS
 * whose body starts with one of these is a STOP and must be honored
 * immediately — see compliance.handleInboundSms().
 */
const STOP_KEYWORDS = ["stop", "stopall", "unsubscribe", "cancel", "end", "quit"];

export function isStopMessage(body: string): boolean {
  const first = body.trim().toLowerCase().split(/\s+/)[0] ?? "";
  return STOP_KEYWORDS.includes(first);
}

/** "start" re-subscribes after a STOP — honored immediately like STOP. */
export function isStartMessage(body: string): boolean {
  const first = body.trim().toLowerCase().split(/\s+/)[0] ?? "";
  return first === "start";
}

/** "help" requests the standard help reply (see compliance.HELP_MESSAGE). */
export function isHelpMessage(body: string): boolean {
  const first = body.trim().toLowerCase().split(/\s+/)[0] ?? "";
  return first === "help";
}

/** Stub used until Twilio SMS is configured. */
export class UnconfiguredSmsProvider implements SmsProvider {
  readonly name = "unconfigured";
  async sendSms(): Promise<{ messageId: string }> {
    throw new Error(
      "SMS provider not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER to enable SMS.",
    );
  }
  parseInboundWebhook(): InboundSms {
    throw new Error("SMS provider not configured.");
  }
}

/** Factory: returns the configured SMS provider, or the stub. */
export function getSmsProvider(): SmsProvider {
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    // TODO: return new TwilioSmsProvider(...) once implemented.
    return new UnconfiguredSmsProvider();
  }
  return new UnconfiguredSmsProvider();
}
