import { z } from "zod";

/** Money is stored as integer cents everywhere. */
export const cents = z.coerce.number().int().min(0);

export const email = z.string().email("Enter a valid email address").max(255);
export const phone = z.string().max(32).optional().or(z.literal(""));
export const uuid = z.string().uuid();

export const companySchema = z.object({
  name: z.string().min(2, "Company name is required").max(120),
  phone: phone,
  email: email.optional().or(z.literal("")),
  website: z.string().max(255).optional().or(z.literal("")),
  timezone: z.string().min(1),
});

export const serviceSchema = z.object({
  name: z.string().min(2, "Service name is required").max(120),
  category: z.enum(["residential", "commercial"]),
  description: z.string().max(500).optional().or(z.literal("")),
  base_price_cents: cents,
  unit: z.enum(["per_visit", "per_hour", "per_sqft"]),
});

export const addonSchema = z.object({
  name: z.string().min(2, "Add-on name is required").max(120),
  price_cents: cents,
});

export const serviceAreaSchema = z.object({
  area_type: z.enum(["city", "county", "zip", "radius"]),
  value: z.string().min(1, "Value is required").max(120),
});

export const inviteSchema = z.object({
  email,
  role: z.enum(["owner", "manager", "cleaner"]),
});

/**
 * Normalize a person name so each word starts with a capital letter and the
 * rest is lowercase: "JOHN o'doe-smith" -> "John O'Doe-Smith".
 * Used for customer names on save.
 */
export function normalizePersonName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) =>
      word
        .split(/([-'\u2019])/)
        .map((part) =>
          part.length === 0 || part === "-" || part === "'" || part === "\u2019"
            ? part
            : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join(""),
    )
    .join(" ");
}

export const customerSchema = z.object({
  name: z
    .string()
    .min(2, "Customer name is required")
    .max(120)
    .transform(normalizePersonName),
  customer_type: z.enum(["residential", "commercial"]).catch("residential"),
  email: email.optional().or(z.literal("")),
  phone: phone,
  notes: z.string().max(2000).optional().or(z.literal("")),
  sms_consent: z.boolean().default(false),
});

export const addressSchema = z.object({
  customer_id: uuid,
  label: z.string().min(1).max(60).default("Home"),
  address_line1: z.string().min(2, "Street address is required").max(255),
  address_line2: z.string().max(255).optional().or(z.literal("")),
  city: z.string().min(1, "City is required").max(120),
  state: z.string().min(1, "State is required").max(60),
  zip: z.string().min(3, "ZIP is required").max(20),
  access_instructions: z.string().max(2000).optional().or(z.literal("")),
  is_default: z.boolean().default(false),
});

export const quoteItemSchema = z.object({
  kind: z.enum(["service", "addon", "custom"]),
  ref_id: z.string().uuid().optional().or(z.literal("")),
  label: z.string().min(1).max(200),
  qty: z.coerce.number().positive().default(1),
  unit_price_cents: cents,
});

export const quoteSchema = z.object({
  customer_id: uuid,
  valid_until: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  discount_cents: cents.default(0),
  tax_rate: z.coerce.number().min(0).max(1).default(0),
  items: z.array(quoteItemSchema).min(1, "Add at least one line item"),
});

export const bookingSchema = z.object({
  customer_id: uuid,
  service_address_id: uuid,
  service_id: z.string().uuid().optional().or(z.literal("")),
  quote_id: z.string().uuid().optional().or(z.literal("")),
  checklist_template_id: z.string().uuid().optional().or(z.literal("")),
  recurrence: z.enum(["none", "weekly", "biweekly", "monthly"]).default("none"),
  scheduled_start: z.string().min(1, "Start date/time is required"),
  scheduled_end: z.string().min(1, "End date/time is required"),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const settingsSchema = z.object({
  name: z.string().min(2).max(120),
  phone: phone,
  email: email.optional().or(z.literal("")),
  website: z.string().max(255).optional().or(z.literal("")),
  timezone: z.string().min(1),
  default_tax_rate: z.coerce.number().min(0).max(1).default(0),
  cancellation_policy: z.string().max(2000).optional().or(z.literal("")),
  freq_weekly: z.coerce.number().min(0).max(2).default(1),
  freq_biweekly: z.coerce.number().min(0).max(2).default(1),
  freq_monthly: z.coerce.number().min(0).max(2).default(1),
  followup_enabled: z.coerce.boolean().default(true),
  followup_days: z.string().max(30).default("2, 5"),
});
