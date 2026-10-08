"use server";

import { z } from "zod";
import { Resend } from "resend";
import { rateLimit, limits, rateLimitError } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  company: z.string().trim().max(100).optional(),
  email: z.string().trim().email("Enter a valid email address").max(200),
  message: z.string().trim().min(10, "Tell us a little more").max(5000),
});

export type ContactResult = { error?: string; ok?: boolean };

/**
 * Contact form submission. Validates, rate-limits (spam), and emails the
 * site owner directly. The submitter's details go ONLY to the owner —
 * nothing is stored, CC'd, or shared elsewhere.
 */
export async function sendContactMessage(
  formData: FormData,
): Promise<ContactResult> {
  const rl = await rateLimit("contact", limits.spammy.max, limits.spammy.windowMs);
  if (!rl.allowed) return rateLimitError(rl.resetIn);

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL ?? "azizdemir6@gmail.com";
  const from = process.env.EMAIL_FROM ?? "TidyPro <hello@tidypro.example>";
  if (!apiKey) {
    return { error: "Messaging isn't set up yet — please try again later." };
  }

  const { name, company, email, message } = parsed.data;
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `TidyPro contact: ${name}${company ? ` (${company})` : ""}`,
    text: [
      `Name: ${name}`,
      company ? `Company: ${company}` : null,
      `Email: ${email}`,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n"),
  });
  if (error) return { error: "Couldn't send your message — please try again." };
  return { ok: true };
}
