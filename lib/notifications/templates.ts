/**
 * Email templates for customer and team notifications.
 * Each template receives a payload and returns subject + HTML + text.
 * Keep them plain and honest — no marketing fluff in transactional mail.
 */

export type TemplateName =
  | "quote_sent"
  | "quote_followup"
  | "quote_approved"
  | "booking_confirmed"
  | "booking_reminder"
  | "job_assigned"
  | "invoice_sent"
  | "payment_received";

type Payload = Record<string, string | number | undefined>;

function money(cents: unknown): string {
  return ((Number(cents) || 0) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function shell(companyName: string, bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
      <p style="font-size: 13px; color: #64748b;">${escapeHtml(companyName)}</p>
      ${bodyHtml}
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8;">Sent by ${escapeHtml(companyName)} via TidyPro.</p>
    </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function renderTemplate(
  template: TemplateName,
  p: Payload,
): { subject: string; html: string; text: string } {
  const company = String(p.company_name ?? "Your cleaning company");
  const greeting = p.recipient_name ? `Hi ${p.recipient_name},` : "Hi,";

  switch (template) {
    case "quote_sent":
      return {
        subject: `Your cleaning quote ${p.quote_number} from ${company}`,
        html: shell(company, `<p>${greeting}</p><p>Your quote <strong>${p.quote_number}</strong> for <strong>${money(p.total_cents)}</strong> is ready.${p.valid_until ? ` It's valid until ${p.valid_until}.` : ""}</p>${p.portal_link ? `<p><a href="${p.portal_link}">Review and approve your quote →</a></p>` : ""}`),
        text: `${greeting}\n\nYour quote ${p.quote_number} for ${money(p.total_cents)} is ready.${p.valid_until ? ` Valid until ${p.valid_until}.` : ""}${p.portal_link ? `\nReview it here: ${p.portal_link}` : ""}`,
      };
    case "quote_followup":
      return {
        subject: `Still interested? Your quote ${p.quote_number} from ${company}`,
        html: shell(company, `<p>${greeting}</p><p>Just checking in — your quote <strong>${p.quote_number}</strong> for <strong>${money(p.total_cents)}</strong> is still available.${p.valid_until ? ` It's valid until ${p.valid_until}.` : ""}</p>${p.portal_link ? `<p><a href="${p.portal_link}">Review and approve it here →</a></p>` : ""}<p style="font-size:13px;color:#64748b;">Questions? Just reply to this email.</p>`),
        text: `${greeting}\n\nJust checking in — your quote ${p.quote_number} for ${money(p.total_cents)} is still available.${p.valid_until ? ` Valid until ${p.valid_until}.` : ""}${p.portal_link ? `\nReview and approve: ${p.portal_link}` : ""}\n\nQuestions? Just reply to this email.`,
      };
    case "quote_approved":
      return {
        subject: `Quote ${p.quote_number} approved — thank you!`,
        html: shell(company, `<p>${greeting}</p><p>Thanks for approving quote <strong>${p.quote_number}</strong>. We'll be in touch shortly to schedule your cleaning.</p>`),
        text: `${greeting}\n\nThanks for approving quote ${p.quote_number}. We'll be in touch shortly to schedule.`,
      };
    case "booking_confirmed":
      return {
        subject: `Cleaning booked — ${p.date} with ${company}`,
        html: shell(company, `<p>${greeting}</p><p>Your cleaning is booked for <strong>${p.date}, ${p.time}</strong> at ${p.address}.</p><p style="font-size:13px;color:#64748b;">${p.cancellation_policy ?? ""}</p>`),
        text: `${greeting}\n\nYour cleaning is booked for ${p.date}, ${p.time} at ${p.address}.`,
      };
    case "booking_reminder":
      return {
        subject: `Reminder: cleaning tomorrow with ${company}`,
        html: shell(company, `<p>${greeting}</p><p>Just a reminder — your cleaning is scheduled for <strong>tomorrow, ${p.time}</strong> at ${p.address}.</p>`),
        text: `${greeting}\n\nReminder: your cleaning is tomorrow, ${p.time} at ${p.address}.`,
      };
    case "job_assigned":
      return {
        subject: `You've been assigned a cleaning — ${p.date}`,
        html: shell(company, `<p>${greeting}</p><p>You've been assigned a cleaning on <strong>${p.date}, ${p.time}</strong> for ${p.customer_name} at ${p.address}.</p><p><a href="${p.job_link ?? "#"}">Open the job →</a></p>`),
        text: `${greeting}\n\nYou've been assigned a cleaning on ${p.date}, ${p.time} for ${p.customer_name} at ${p.address}.`,
      };
    case "invoice_sent":
      return {
        subject: `Invoice ${p.invoice_number} from ${company} — ${money(p.total_cents)}`,
        html: shell(company, `<p>${greeting}</p><p>Your invoice <strong>${p.invoice_number}</strong> for <strong>${money(p.total_cents)}</strong> is ready.${p.due_date ? ` Please pay by ${p.due_date}.` : ""}</p>${p.portal_link ? `<p><a href="${p.portal_link}">View and pay your invoice →</a></p>` : ""}`),
        text: `${greeting}\n\nYour invoice ${p.invoice_number} for ${money(p.total_cents)} is ready.${p.due_date ? ` Due ${p.due_date}.` : ""}${p.portal_link ? `\nView and pay: ${p.portal_link}` : ""}`,
      };
    case "payment_received":
      return {
        subject: `Payment received — thank you!`,
        html: shell(company, `<p>${greeting}</p><p>We've received your payment of <strong>${money(p.amount_cents)}</strong> for invoice ${p.invoice_number}. Thank you!</p>`),
        text: `${greeting}\n\nWe've received your payment of ${money(p.amount_cents)} for invoice ${p.invoice_number}. Thank you!`,
      };
  }
}
