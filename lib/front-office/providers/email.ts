/**
 * Email provider interface (Resend).
 *
 * The platform already sends email through Resend (see
 * lib/notifications/send.ts); this interface gives the Front Office
 * assistant its own seam so the vendor can be swapped without touching
 * callers.
 */

export type OutboundEmail = {
  to: string;
  subject: string;
  /** Plain-text body (preferred for deliverability). */
  text?: string;
  html?: string;
  /** Replies go to the company's enquiry inbox, never to us. */
  replyTo?: string;
  companyId: string;
  customerId?: string;
};

export interface EmailProvider {
  readonly name: string;
  /** Send one email. Caller must have verified email consent. */
  sendEmail(email: OutboundEmail): Promise<{ messageId: string }>;
}

/** Stub used until Resend is configured. */
export class UnconfiguredEmailProvider implements EmailProvider {
  readonly name = "unconfigured";
  async sendEmail(): Promise<{ messageId: string }> {
    throw new Error(
      "Email provider not configured. Set RESEND_API_KEY to enable email.",
    );
  }
}

/** Factory: returns the configured email provider, or the stub. */
export function getEmailProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY) {
    // TODO: return new ResendEmailProvider(...) once implemented.
    return new UnconfiguredEmailProvider();
  }
  return new UnconfiguredEmailProvider();
}
