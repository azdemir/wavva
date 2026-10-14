import { z } from "zod";

const emailSchema = z.string().email();

/**
 * Build the From header for customer-facing email. Prefers the business's
 * own email (Settings → Company profile → Email) so customers see mail from
 * the company, not the platform. Falls back to the platform default.
 *
 * NOTE: Resend requires the sender domain to be verified — mail from an
 * unverified business domain will be rejected by Resend.
 */
export function senderFor(company: {
  name: string;
  email: string | null;
}): string {
  const email = company.email?.trim() ?? "";
  if (email && emailSchema.safeParse(email).success) {
    const name = company.name.trim() || "Your business";
    return `${name} <${email}>`;
  }
  return process.env.EMAIL_FROM ?? "Switchboard <hello@switchboard.example>";
}
