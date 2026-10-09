"use server";

import { z } from "zod";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  customerId: z.string().uuid(),
  link: z.string().url().max(500),
});

/** Email the customer their portal link via Resend. */
export async function sendPortalLinkEmail(
  customerId: string,
  link: string,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = schema.safeParse({ customerId, link });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const { company } = await requireCompany();

  // Rate limit: 10 portal emails per hour.
  const rl = await rateLimit("portal-email", 10, 60 * 60 * 1000);
  if (!rl.allowed) return { ok: false, error: "Too many emails. Try again later." };

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("name, email")
    .eq("id", customerId)
    .eq("company_id", company.id)
    .single();
  const c = customer ? one(customer as unknown as { name: string; email: string | null }) : null;
  if (!c?.email) return { ok: false, error: "This customer has no email address on file." };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "Email sending is not configured." };
  const from = process.env.EMAIL_FROM ?? "TidyPro <hello@tidypro.example>";

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: c.email,
    subject: `Your ${company.name} customer portal`,
    html: `
      <p>Hi ${c.name},</p>
      <p>${company.name} has set up a private customer portal for you. Use this link to approve quotes, see upcoming visits, and pay invoices — no login needed:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Please keep this link private — anyone with it can view your account.</p>
      <p>— The ${company.name} team</p>
    `,
    text: `Hi ${c.name},\n\n${company.name} has set up a private customer portal for you. Use this link to approve quotes, see upcoming visits, and pay invoices — no login needed:\n\n${link}\n\nPlease keep this link private — anyone with it can view your account.\n\n— The ${company.name} team`,
  });

  if (error) return { ok: false, error: "Could not send the email. Try again." };
  return { ok: true };
}
