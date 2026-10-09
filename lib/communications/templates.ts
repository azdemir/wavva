/**
 * Data-driven communication template catalog for TidyPro.
 *
 * Every automated message — email or SMS, to customers or cleaners — is
 * defined here as data, not code. Per-company customizations live in the
 * `communication_templates` table (migration 0011); the defaults below are
 * the fallback, so improving a default here propagates to every company
 * that hasn't overridden that template.
 *
 * Templates use {{variable}} placeholders. Values are HTML-escaped when
 * rendered into email; SMS bodies are plain text and never escaped.
 */

export type CommunicationAudience = "customer" | "cleaner";
export type CommunicationChannel = "email" | "sms";

export type TemplateKey =
  // Customer lifecycle
  | "quote_sent"
  | "quote_followup"
  | "quote_approved"
  | "booking_confirmed"
  | "booking_reminder"
  | "job_completed"
  | "invoice_sent"
  | "payment_reminder"
  | "payment_received"
  | "portal_invite"
  // Cleaner (crew) lifecycle
  | "job_assigned"
  | "job_reminder"
  | "job_cancelled"
  | "job_updated";

export interface TemplateVariableDoc {
  /** Variable name without braces, e.g. "customer_name". */
  name: string;
  description: string;
  /** Where the value comes from at send time. */
  source: string;
  /** Example value used in the Settings preview. */
  sample: string;
}

/**
 * Registry of every {{variable}} a template may use, and where its value
 * comes from. The Settings editor renders these as clickable chips.
 */
export const VARIABLE_REGISTRY: TemplateVariableDoc[] = [
  { name: "recipient_name", description: "First name of the recipient", source: "customers.name, or the team member's name", sample: "Jane" },
  { name: "cleaner_name", description: "Name of the assigned cleaner", source: "memberships (team member name)", sample: "Maria" },
  { name: "company_name", description: "The cleaning business's name", source: "companies.name", sample: "SparkleClean" },
  { name: "customer_name", description: "Customer's full name (used in cleaner messages)", source: "customers.name", sample: "Jane Smith" },
  { name: "date", description: "Formatted visit date", source: "jobs.scheduled_start (company timezone)", sample: "Sat, Oct 10" },
  { name: "time", description: "Formatted visit time or time range", source: "jobs.scheduled_start/end (company timezone)", sample: "9:00 AM – 11:00 AM" },
  { name: "address", description: "Service address", source: "service_addresses", sample: "123 Main St, Albany" },
  { name: "service", description: "Service name", source: "services.name", sample: "Deep Clean" },
  { name: "amount", description: "Formatted money amount", source: "total_cents / amount_cents in the payload", sample: "$120.00" },
  { name: "total", description: "Formatted total (quotes & invoices)", source: "total_cents in the payload", sample: "$120.00" },
  { name: "portal_link", description: "Customer portal link (quotes, invoices, review)", source: "generated portal token URL", sample: "https://app.example.com/p/abc123" },
  { name: "job_link", description: "Link to the job in the dashboard (cleaners)", source: "dashboard job URL", sample: "https://app.example.com/dashboard/jobs/abc123" },
  { name: "quote_number", description: "Quote number", source: "quotes.quote_number", sample: "Q-0007" },
  { name: "invoice_number", description: "Invoice number", source: "invoices.invoice_number", sample: "I-0042" },
  { name: "due_date", description: "Invoice due date", source: "invoices.due_date", sample: "Oct 15, 2026" },
  { name: "valid_until", description: "Quote expiry date", source: "quotes.valid_until", sample: "Oct 24, 2026" },
  { name: "cancellation_policy", description: "Company cancellation policy", source: "companies.settings.cancellation_policy", sample: "Free cancellation up to 24 hours before." },
];

export interface TemplateDefinition {
  key: TemplateKey;
  audience: CommunicationAudience;
  channels: CommunicationChannel[];
  /** Short label shown in Settings. */
  label: string;
  /** One-line description shown in Settings. */
  description: string;
  emailSubject: string;
  /** HTML body with {{variables}}. */
  emailBody: string;
  /** Plain-text body with {{variables}}. */
  smsBody: string;
  /** Variables this template uses (subset of the registry). */
  variables: string[];
}

const B = (inner: string) =>
  `<p>Hi {{recipient_name}},</p>${inner}`;

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  // ---------------------------------------------------------------
  // Customers
  // ---------------------------------------------------------------
  {
    key: "quote_sent",
    audience: "customer",
    channels: ["email", "sms"],
    label: "Quote sent",
    description: "Sent when a quote is marked as sent.",
    emailSubject: "Your cleaning quote {{quote_number}} from {{company_name}}",
    emailBody: B(
      `<p>Your quote <strong>{{quote_number}}</strong> for <strong>{{total}}</strong> is ready.{{valid_until_sentence}}</p><p><a href="{{portal_link}}">Review and approve your quote →</a></p>`,
    ),
    smsBody:
      "Hi {{recipient_name}}, your quote {{quote_number}} ({{total}}) from {{company_name}} is ready: {{portal_link}}",
    variables: ["recipient_name", "company_name", "quote_number", "total", "valid_until", "portal_link"],
  },
  {
    key: "quote_followup",
    audience: "customer",
    channels: ["email", "sms"],
    label: "Quote follow-up",
    description: "Automatic nudge while a quote is still awaiting a decision.",
    emailSubject: "Still interested? Your quote {{quote_number}} from {{company_name}}",
    emailBody: B(
      `<p>Just checking in — your quote <strong>{{quote_number}}</strong> for <strong>{{total}}</strong> is still available.{{valid_until_sentence}}</p><p><a href="{{portal_link}}">Review and approve it here →</a></p><p style="font-size:13px;color:#64748b;">Questions? Just reply to this email.</p>`,
    ),
    smsBody:
      "Hi {{recipient_name}}, just checking in — your quote {{quote_number}} ({{total}}) from {{company_name}} is still available: {{portal_link}}",
    variables: ["recipient_name", "company_name", "quote_number", "total", "valid_until", "portal_link"],
  },
  {
    key: "quote_approved",
    audience: "customer",
    channels: ["email", "sms"],
    label: "Quote approved",
    description: "Confirmation when the customer approves a quote.",
    emailSubject: "Quote {{quote_number}} approved — thank you!",
    emailBody: B(
      `<p>Thanks for approving quote <strong>{{quote_number}}</strong>. We'll be in touch shortly to schedule your cleaning.</p>`,
    ),
    smsBody:
      "Hi {{recipient_name}}, thanks for approving quote {{quote_number}}! We'll be in touch shortly to schedule your cleaning. — {{company_name}}",
    variables: ["recipient_name", "company_name", "quote_number"],
  },
  {
    key: "booking_confirmed",
    audience: "customer",
    channels: ["email", "sms"],
    label: "Booking confirmed",
    description: "Sent right after a booking is created.",
    emailSubject: "Cleaning booked — {{date}} with {{company_name}}",
    emailBody: B(
      `<p>Your cleaning is booked for <strong>{{date}}, {{time}}</strong> at {{address}}.</p>{{cancellation_policy_paragraph}}`,
    ),
    smsBody:
      "Hi {{recipient_name}}, your cleaning with {{company_name}} is booked for {{date}}, {{time}} at {{address}}.",
    variables: ["recipient_name", "company_name", "date", "time", "address", "cancellation_policy"],
  },
  {
    key: "booking_reminder",
    audience: "customer",
    channels: ["email", "sms"],
    label: "Booking reminder (day before)",
    description: "Sent automatically the day before a scheduled job.",
    emailSubject: "Reminder: cleaning tomorrow with {{company_name}}",
    emailBody: B(
      `<p>Just a reminder — your cleaning is scheduled for <strong>tomorrow, {{time}}</strong> at {{address}}.</p>`,
    ),
    smsBody:
      "Hi {{recipient_name}}, reminder: your cleaning with {{company_name}} is tomorrow, {{time}} at {{address}}.",
    variables: ["recipient_name", "company_name", "time", "address"],
  },
  {
    key: "job_completed",
    audience: "customer",
    channels: ["email", "sms"],
    label: "Job completed + review request",
    description: "Sent when a job is marked complete, with a review ask.",
    emailSubject: "Your cleaning is done — how did we do?",
    emailBody: B(
      `<p>Your cleaning on <strong>{{date}}</strong> is complete. We hope everything looks great!</p><p>If you have a moment, we'd love a quick review — it really helps our small business.</p><p><a href="{{portal_link}}">Leave a review →</a></p>`,
    ),
    smsBody:
      "Hi {{recipient_name}}, your cleaning with {{company_name}} is done! If you have a moment we'd love a quick review: {{portal_link}}",
    variables: ["recipient_name", "company_name", "date", "portal_link"],
  },
  {
    key: "invoice_sent",
    audience: "customer",
    channels: ["email", "sms"],
    label: "Invoice sent",
    description: "Sent when an invoice is marked as sent.",
    emailSubject: "Invoice {{invoice_number}} from {{company_name}} — {{amount}}",
    emailBody: B(
      `<p>Your invoice <strong>{{invoice_number}}</strong> for <strong>{{amount}}</strong> is ready.{{due_date_sentence}}</p><p><a href="{{portal_link}}">View and pay your invoice →</a></p>`,
    ),
    smsBody:
      "Hi {{recipient_name}}, your invoice {{invoice_number}} ({{amount}}) from {{company_name}} is ready: {{portal_link}}",
    variables: ["recipient_name", "company_name", "invoice_number", "amount", "due_date", "portal_link"],
  },
  {
    key: "payment_reminder",
    audience: "customer",
    channels: ["email", "sms"],
    label: "Payment reminder (overdue)",
    description: "Sent automatically for invoices past their due date.",
    emailSubject: "Friendly reminder: invoice {{invoice_number}} ({{amount}}) is overdue",
    emailBody: B(
      `<p>This is a friendly reminder that invoice <strong>{{invoice_number}}</strong> for <strong>{{amount}}</strong> was due on {{due_date}} and is still outstanding.</p><p><a href="{{portal_link}}">Pay now →</a></p><p style="font-size:13px;color:#64748b;">If you've already paid, please ignore this message.</p>`,
    ),
    smsBody:
      "Hi {{recipient_name}}, friendly reminder: invoice {{invoice_number}} ({{amount}}) from {{company_name}} was due {{due_date}}. Pay here: {{portal_link}}",
    variables: ["recipient_name", "company_name", "invoice_number", "amount", "due_date", "portal_link"],
  },
  {
    key: "payment_received",
    audience: "customer",
    channels: ["email", "sms"],
    label: "Payment received",
    description: "Thank-you sent when a payment is recorded.",
    emailSubject: "Payment received — thank you!",
    emailBody: B(
      `<p>We've received your payment of <strong>{{amount}}</strong> for invoice {{invoice_number}}. Thank you!</p>`,
    ),
    smsBody:
      "Hi {{recipient_name}}, we've received your payment of {{amount}} for invoice {{invoice_number}}. Thank you! — {{company_name}}",
    variables: ["recipient_name", "company_name", "amount", "invoice_number"],
  },
  {
    key: "portal_invite",
    audience: "customer",
    channels: ["email", "sms"],
    label: "Portal invite",
    description: "Invites the customer to their self-serve portal.",
    emailSubject: "Your {{company_name}} customer portal",
    emailBody: B(
      `<p>You now have a private customer portal where you can approve quotes, see upcoming visits, and pay invoices — no login needed.</p><p><a href="{{portal_link}}">Open your portal →</a></p>`,
    ),
    smsBody:
      "Hi {{recipient_name}}, open your {{company_name}} customer portal to approve quotes, see visits, and pay invoices: {{portal_link}}",
    variables: ["recipient_name", "company_name", "portal_link"],
  },
  // ---------------------------------------------------------------
  // Cleaners (crew)
  // ---------------------------------------------------------------
  {
    key: "job_assigned",
    audience: "cleaner",
    channels: ["email", "sms"],
    label: "Job assigned",
    description: "Sent to a cleaner when they're assigned to a job.",
    emailSubject: "You've been assigned a cleaning — {{date}}",
    emailBody: B(
      `<p>You've been assigned a cleaning on <strong>{{date}}, {{time}}</strong> for {{customer_name}} at {{address}}.</p><p><a href="{{job_link}}">Open the job →</a></p>`,
    ),
    smsBody:
      "Hi {{recipient_name}}, you've been assigned a cleaning on {{date}}, {{time}} for {{customer_name}} at {{address}}. — {{company_name}}",
    variables: ["recipient_name", "company_name", "date", "time", "customer_name", "address", "job_link"],
  },
  {
    key: "job_reminder",
    audience: "cleaner",
    channels: ["email", "sms"],
    label: "Job reminder (day before)",
    description: "Sent to assigned cleaners the day before a job.",
    emailSubject: "Reminder: cleaning tomorrow — {{date}}, {{time}}",
    emailBody: B(
      `<p>Just a reminder — you're scheduled for a cleaning <strong>tomorrow, {{time}}</strong> for {{customer_name}} at {{address}}.</p><p><a href="{{job_link}}">Open the job →</a></p>`,
    ),
    smsBody:
      "Hi {{recipient_name}}, reminder: cleaning tomorrow, {{time}} for {{customer_name}} at {{address}}. — {{company_name}}",
    variables: ["recipient_name", "company_name", "date", "time", "customer_name", "address", "job_link"],
  },
  {
    key: "job_cancelled",
    audience: "cleaner",
    channels: ["email", "sms"],
    label: "Job cancelled",
    description: "Sent to assigned cleaners when a job is cancelled.",
    emailSubject: "Cleaning cancelled — {{date}}",
    emailBody: B(
      `<p>Heads up — the cleaning scheduled for <strong>{{date}}, {{time}}</strong> for {{customer_name}} at {{address}} has been cancelled. No need to show up.</p>`,
    ),
    smsBody:
      "Hi {{recipient_name}}, the cleaning on {{date}}, {{time}} for {{customer_name}} has been cancelled. No need to show up. — {{company_name}}",
    variables: ["recipient_name", "company_name", "date", "time", "customer_name", "address"],
  },
  {
    key: "job_updated",
    audience: "cleaner",
    channels: ["email", "sms"],
    label: "Job updated",
    description: "Sent when a job's time or address changes.",
    emailSubject: "Schedule change — {{date}}, {{time}}",
    emailBody: B(
      `<p>Heads up — the cleaning for {{customer_name}} has been updated. New details: <strong>{{date}}, {{time}}</strong> at {{address}}.</p><p><a href="{{job_link}}">Open the job →</a></p>`,
    ),
    smsBody:
      "Hi {{recipient_name}}, schedule change: cleaning for {{customer_name}} is now {{date}}, {{time}} at {{address}}. — {{company_name}}",
    variables: ["recipient_name", "company_name", "date", "time", "customer_name", "address", "job_link"],
  },
];

export const TEMPLATE_MAP: Record<TemplateKey, TemplateDefinition> = Object.fromEntries(
  TEMPLATE_DEFINITIONS.map((d) => [d.key, d]),
) as Record<TemplateKey, TemplateDefinition>;

export function getTemplateDefinition(key: TemplateKey): TemplateDefinition {
  return TEMPLATE_MAP[key];
}

export function templatesForAudience(audience: CommunicationAudience): TemplateDefinition[] {
  return TEMPLATE_DEFINITIONS.filter((d) => d.audience === audience);
}

export function supportsChannel(key: TemplateKey, channel: CommunicationChannel): boolean {
  return TEMPLATE_MAP[key].channels.includes(channel);
}

// ---------------------------------------------------------------------------
// {{variable}} substitution engine
// ---------------------------------------------------------------------------

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function formatMoney(cents: unknown): string {
  return ((Number(cents) || 0) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export type TemplateValues = Record<string, unknown>;

/**
 * Normalize a raw notification payload into the values a template expects.
 * Adds friendly defaults and derives formatted helpers:
 * - `amount` from `amount_cents` (else `total_cents`)
 * - `total` from `total_cents`
 * - `recipient_name` defaults to "there"
 * - `company_name` defaults to "Your cleaning company"
 * - `valid_until_sentence` / `due_date_sentence` /
 *   `cancellation_policy_paragraph` render optional blocks so companies
 *   don't need conditionals in their custom templates.
 */
/** A value that is already-safe HTML — inserted without escaping. */
export interface SafeHtml {
  __html: string;
}

export type NormalizedValues = Record<string, string | SafeHtml>;

function isSafeHtml(v: unknown): v is SafeHtml {
  return typeof v === "object" && v !== null && "__html" in v;
}

export function normalizeValues(payload: TemplateValues): NormalizedValues {
  const values: NormalizedValues = {};
  for (const [k, v] of Object.entries(payload ?? {})) {
    if (v === undefined || v === null) continue;
    values[k] = String(v);
  }
  const str = (v: string | SafeHtml | undefined): string | undefined =>
    typeof v === "string" ? v : undefined;
  if (str(values.amount) === undefined) {
    if (payload.amount_cents !== undefined && payload.amount_cents !== null) {
      values.amount = formatMoney(payload.amount_cents);
    } else if (payload.total_cents !== undefined && payload.total_cents !== null) {
      values.amount = formatMoney(payload.total_cents);
    }
  }
  if (str(values.total) === undefined && payload.total_cents !== undefined && payload.total_cents !== null) {
    values.total = formatMoney(payload.total_cents);
  }
  values.recipient_name = str(values.recipient_name) || "there";
  values.company_name = str(values.company_name) || "Your cleaning company";
  // Optional sentence helpers (plain text; escaped like everything else).
  const validUntil = str(values.valid_until);
  const dueDate = str(values.due_date);
  const policy = str(values.cancellation_policy);
  values.valid_until_sentence = validUntil ? ` It's valid until ${validUntil}.` : "";
  values.due_date_sentence = dueDate ? ` Please pay by ${dueDate}.` : "";
  values.cancellation_policy_paragraph = policy
    ? { __html: `<p style="font-size:13px;color:#64748b;">${escapeHtml(policy)}</p>` }
    : { __html: "" };
  return values;
}

/**
 * Substitute {{variables}} in a template string.
 * Missing variables render as "" (never leak the placeholder to a
 * recipient). Set `escape` for HTML contexts (email), false for SMS.
 */
export function renderString(
  template: string,
  values: NormalizedValues,
  opts: { escape: boolean } = { escape: false },
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, name: string) => {
    const v = values[name];
    if (v === undefined || v === null) return "";
    if (isSafeHtml(v)) return v.__html;
    return opts.escape ? escapeHtml(String(v)) : String(v);
  });
}

/** Strip HTML tags and decode common entities → plain text. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function emailShell(companyName: string, bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
      <p style="font-size: 13px; color: #64748b;">${escapeHtml(companyName)}</p>
      ${bodyHtml}
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8;">Sent by ${escapeHtml(companyName)} via TidyPro.</p>
    </div>`;
}

export interface TemplateOverride {
  /** Custom email subject (null/undefined → default). */
  subject?: string | null;
  /** Custom body: email HTML for the email channel, plain text for SMS. */
  body?: string | null;
  enabled?: boolean;
}

export interface RenderedTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Render a template for the email channel. `override` carries the company's
 * per-template customization (from the communication_templates table).
 */
export function renderCommunicationTemplate(
  key: TemplateKey,
  payload: TemplateValues,
  override?: TemplateOverride | null,
): RenderedTemplate {
  const def = getTemplateDefinition(key);
  const values = normalizeValues(payload);
  const subjectTpl = override?.subject || def.emailSubject;
  const bodyTpl = override?.body || def.emailBody;
  const subject = renderString(subjectTpl, values, { escape: true });
  const bodyHtml = renderString(bodyTpl, values, { escape: true });
  const companyName = values.company_name;
  const html = emailShell(typeof companyName === "string" ? companyName : "Your cleaning company", bodyHtml);
  return { subject, html, text: htmlToText(html) };
}

/** Render a template for the SMS channel (plain text, never escaped). */
export function renderSmsTemplate(
  key: TemplateKey,
  payload: TemplateValues,
  override?: TemplateOverride | null,
): string {
  const def = getTemplateDefinition(key);
  const values = normalizeValues(payload);
  const tpl = override?.body || def.smsBody;
  return renderString(tpl, values, { escape: false });
}
