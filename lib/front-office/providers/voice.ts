import { AI_DISCLOSURE_LINE, CALL_RECORDING_DISCLOSURE } from "../compliance";

/**
 * Voice (AI call answering) provider interface.
 *
 * Design notes:
 * - The ONLY voice capability is answering INBOUND calls. There is
 *   deliberately no "dial out" / outbound-calling method anywhere in this
 *   interface: the Front Office Service never makes automated sales calls.
 * - Every answered call must start with the AI disclosure greeting (see
 *   compliance.ts). buildGreeting() bakes it in so no implementation can
 *   forget it.
 */

export type InboundCallContext = {
  /** The caller's phone number (E.164). */
  from: string;
  /** The company's business line that was dialed (E.164). */
  to: string;
  /** Display name of the company — used in the disclosure greeting. */
  companyName: string;
  companyId: string;
  /** Provider's call identifier (e.g. Twilio CallSid). */
  providerCallId: string;
};

export type VoiceCallResult = {
  providerCallId: string;
  /** What the assistant said/did, for the conversation log. */
  summary: string;
  /** True when the call was escalated to the owner by text. */
  escalated: boolean;
};

export interface VoiceProvider {
  readonly name: string;
  /**
   * Build the opening utterance for an inbound call. MUST begin with the
   * AI disclosure + call-recording line. Implementations return
   * provider-native markup (e.g. TwiML <Say>) or plain SSML text.
   */
  buildGreeting(ctx: InboundCallContext): string;
  /**
   * Handle a completed inbound call: transcribe, act on it (quote from the
   * price list, book, escalate), and write to the conversation log.
   * Throws when the provider isn't configured.
   */
  handleInboundCall(ctx: InboundCallContext): Promise<VoiceCallResult>;
}

/**
 * Default greeting: disclosure first, always. Callers are told plainly
 * they're speaking with the company's AI assistant, and that the call may
 * be recorded.
 */
export function defaultGreeting(companyName: string): string {
  return `${AI_DISCLOSURE_LINE(companyName)} ${CALL_RECORDING_DISCLOSURE} How can I help you today?`;
}

/** Stub used until a voice provider (Twilio) is configured. */
export class UnconfiguredVoiceProvider implements VoiceProvider {
  readonly name = "unconfigured";
  buildGreeting(ctx: InboundCallContext): string {
    return defaultGreeting(ctx.companyName);
  }
  async handleInboundCall(): Promise<VoiceCallResult> {
    throw new Error(
      "Voice provider not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER to enable AI call answering.",
    );
  }
}

/** Factory: returns the configured voice provider, or the stub. */
export function getVoiceProvider(): VoiceProvider {
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    // TODO: return new TwilioVoiceProvider(...) once implemented.
    return new UnconfiguredVoiceProvider();
  }
  return new UnconfiguredVoiceProvider();
}
