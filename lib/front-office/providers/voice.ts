import { validateRequest, twiml as twilioTwiml } from "twilio";
import {
  AI_DISCLOSURE_LINE,
  CALL_RECORDING_DISCLOSURE,
  NO_OUTBOUND_SALES_CALLS,
} from "../compliance";

/**
 * Voice (AI call answering) provider interface.
 *
 * Design notes:
 * - The ONLY voice capability is answering INBOUND calls. There is
 *   deliberately no "dial out" / outbound-calling method anywhere in this
 *   interface: the Front Office Service never makes automated sales calls
 *   (see NO_OUTBOUND_SALES_CALLS in compliance.ts).
 * - Every answered call must start with the AI disclosure greeting (see
 *   compliance.ts). buildGreeting() bakes it in so no implementation can
 *   forget it.
 */

// Re-exported so linters and callers see the constraint is honored.
void NO_OUTBOUND_SALES_CALLS;

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

/**
 * Twilio voice provider.
 *
 * Turn-by-turn conversational AI that runs on serverless: each answered
 * call gets TwiML with <Gather input="speech">; Twilio posts the
 * transcription to /api/webhooks/voice/turn, which runs the AI brain
 * (lib/front-office/ai-brain.ts) and answers with <Say> + another <Gather>.
 * Minutes are metered from Twilio's statusCallback
 * (/api/webhooks/voice/status) and counted against the plan's included
 * minutes in the dashboard.
 */
export class TwilioVoiceProvider implements VoiceProvider {
  readonly name = "twilio";

  buildGreeting(ctx: InboundCallContext): string {
    return defaultGreeting(ctx.companyName);
  }

  async handleInboundCall(): Promise<VoiceCallResult> {
    // Inbound calls are handled by the webhook routes, not here. This
    // method exists to satisfy the interface for completed-call summaries.
    throw new Error(
      "Inbound calls are handled live by /api/webhooks/voice; see front_office_ai_calls for the log.",
    );
  }
}

/** Verify a Twilio webhook signature. Rejects forged call events. */
export function verifyTwilioSignature(
  url: string,
  signature: string | null,
  params: Record<string, string>,
): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !signature) return false;
  try {
    return validateRequest(token, signature, url, params);
  } catch {
    return false;
  }
}

/** TwiML: greeting + speech gather loop for one AI turn. */
export function twimlGatherTurn(say: string, turnUrl: string): string {
  const r = new twilioTwiml.VoiceResponse();
  r.say({ voice: "Polly.Joanna" }, say);
  const gather = r.gather({
    input: ["speech"],
    speechTimeout: "auto",
    language: "en-US",
    action: turnUrl,
    method: "POST",
  });
  gather.say({ voice: "Polly.Joanna" }, "How can I help you?");
  r.say({ voice: "Polly.Joanna" }, "I didn't catch that. Goodbye.");
  return r.toString();
}

/** TwiML: speak a final line and hang up. */
export function twimlSayAndHangup(say: string): string {
  const r = new twilioTwiml.VoiceResponse();
  r.say({ voice: "Polly.Joanna" }, say);
  r.hangup();
  return r.toString();
}

/** TwiML: polite rejection for misconfigured lines. */
export function twimlNotConfigured(): string {
  return twimlSayAndHangup(
    "Sorry, this line isn't set up for automated answering yet. Goodbye.",
  );
}

/** Factory: returns the configured voice provider, or the stub. */
export function getVoiceProvider(): VoiceProvider {
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    return new TwilioVoiceProvider();
  }
  return new UnconfiguredVoiceProvider();
}

/** True when inbound voice webhooks can actually answer calls. */
export function isVoiceConfigured(): boolean {
  return (
    !!process.env.TWILIO_ACCOUNT_SID &&
    !!process.env.TWILIO_AUTH_TOKEN &&
    !!process.env.TWILIO_PHONE_NUMBER
  );
}
