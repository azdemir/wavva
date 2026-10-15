"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { normalizePersonName } from "@/lib/validation";

export type PriceListItem = {
  name: string;
  price_cents: number;
  /** Optional range: when max > min the AI quotes "typically between min and max". */
  price_min_cents?: number;
  price_max_cents?: number;
  unit: string;
};

export type FrontOfficeSettingsView = {
  id: string;
  plan: string;
  price_list: PriceListItem[];
  service_area: string;
  policies: string;
  business_line: string;
  enquiry_inbox: string;
  timezone: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
};

const priceItemSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    price_cents: z.coerce.number().int().min(0),
    price_min_cents: z.coerce.number().int().min(0).optional(),
    price_max_cents: z.coerce.number().int().min(0).optional(),
    unit: z.string().trim().max(40).default("per visit"),
  })
  .refine(
    (i) =>
      i.price_max_cents === undefined ||
      i.price_min_cents === undefined ||
      i.price_max_cents > i.price_min_cents,
    { message: "Range max must be above min." },
  );

/** Owner-only: this company's Front Office settings, or null if not started. */
export async function getFrontOfficeSettings(): Promise<FrontOfficeSettingsView | null> {
  const { company } = await requireOwner();
  const supabase = await createClient();
  const { data } = await supabase
    .from("front_office_settings")
    .select(
      "id, plan, price_list, service_area, policies, business_line, enquiry_inbox, timezone, quiet_hours_start, quiet_hours_end",
    )
    .eq("company_id", company.id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    plan: data.plan as string,
    price_list: (data.price_list ?? []) as PriceListItem[],
    service_area: (data.service_area as string) ?? "",
    policies: (data.policies as string) ?? "",
    business_line: (data.business_line as string) ?? "",
    enquiry_inbox: (data.enquiry_inbox as string) ?? "",
    timezone: (data.timezone as string) ?? "America/New_York",
    quiet_hours_start: (data.quiet_hours_start as string) ?? "08:00",
    quiet_hours_end: (data.quiet_hours_end as string) ?? "21:00",
  };
}

/**
 * Owner-only: save the AI price list (step 1 of the setup wizard).
 * This is the ONLY source the assistant may quote from.
 */
export async function saveFrontOfficePriceList(
  items: PriceListItem[],
): Promise<{ ok: boolean; error?: string }> {
  const { company } = await requireOwner();
  const parsed = z.array(priceItemSchema).max(200).safeParse(items);
  if (!parsed.success) return { ok: false, error: "Check your prices and try again." };
  const supabase = await createClient();
  const { error } = await supabase.from("front_office_settings").upsert(
    {
      company_id: company.id,
      plan: "front_desk",
      price_list: parsed.data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" },
  );
  if (error) return { ok: false, error: "Couldn't save your price list." };
  revalidatePath("/dashboard/front-office");
  return { ok: true };
}

const basicsSchema = z.object({
  service_area: z.string().trim().max(2000).default(""),
  policies: z.string().trim().max(5000).default(""),
  business_line: z.string().trim().max(32).default(""),
  enquiry_inbox: z.string().trim().max(255).default(""),
  timezone: z.string().trim().min(1).max(64).default("America/New_York"),
});

/**
 * Owner-only: save service area, policies, business line and enquiry inbox
 * (steps 2–4 of the setup wizard).
 */
export async function saveFrontOfficeBasics(
  input: z.infer<typeof basicsSchema>,
): Promise<{ ok: boolean; error?: string }> {
  const { company } = await requireOwner();
  const parsed = basicsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the form and try again." };
  const supabase = await createClient();
  const { error } = await supabase.from("front_office_settings").upsert(
    {
      company_id: company.id,
      plan: "front_desk",
      ...parsed.data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" },
  );
  if (error) return { ok: false, error: "Couldn't save your details." };
  revalidatePath("/dashboard/front-office");
  return { ok: true };
}

const importRowSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(32).default(""),
  email: z.string().trim().max(255).default(""),
  sms_consent: z.boolean().default(false),
  email_consent: z.boolean().default(false),
});

/**
 * Owner-only: import customers from the wizard's CSV step, with per-customer
 * consent flags. Consent timestamps and source ("csv_upload") are recorded;
 * unchecked boxes mean NO consent (the assistant never follows up without
 * consent). Skips rows whose phone+email already exist for the company.
 */
export async function importFrontOfficeCustomers(
  rows: z.infer<typeof importRowSchema>[],
): Promise<{ ok: boolean; imported: number; skipped: number; companyId: string; error?: string }> {
  const { company } = await requireOwner();
  const parsed = z.array(importRowSchema).max(2000).safeParse(rows);
  if (!parsed.success)
    return { ok: false, imported: 0, skipped: 0, companyId: company.id, error: "Check your customer list and try again." };
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("customers")
    .select("phone, email")
    .eq("company_id", company.id)
    .limit(5000);
  const seen = new Set(
    (existing ?? []).map(
      (c) => `${(c.phone ?? "").trim().toLowerCase()}|${(c.email ?? "").trim().toLowerCase()}`,
    ),
  );

  const inserts = [];
  let skipped = 0;
  for (const r of parsed.data) {
    const key = `${r.phone.trim().toLowerCase()}|${r.email.trim().toLowerCase()}`;
    if (seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    inserts.push({
      company_id: company.id,
      name: normalizePersonName(r.name),
      phone: r.phone || null,
      email: r.email || null,
      sms_consent: r.sms_consent && !!r.phone,
      sms_consent_at: r.sms_consent && r.phone ? now : null,
      sms_consent_source: r.sms_consent && r.phone ? "csv_upload" : null,
      email_consent: r.email_consent && !!r.email,
      email_consent_at: r.email_consent && r.email ? now : null,
      email_consent_source: r.email_consent && r.email ? "csv_upload" : null,
    });
  }

  if (inserts.length > 0) {
    const { error } = await supabase.from("customers").insert(inserts);
    if (error) {
      return { ok: false, imported: 0, skipped, companyId: company.id, error: "Couldn't import your customers." };
    }
  }
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/front-office");
  return { ok: true, imported: inserts.length, skipped, companyId: company.id };
}

/* ------------------------------------------------------------------ */
/* Dashboard: stats, escalations, conversation log                      */
/* ------------------------------------------------------------------ */

export type FrontOfficeStats = {
  enquiries7d: number;
  booked7d: number;
  openQuotes: number;
  collectedCents7d: number;
  overdueCount: number;
  overdueCents: number;
};

/** Owner/staff: real-data Front Office panel stats for the last 7 days. */
export async function getFrontOfficeStats(): Promise<FrontOfficeStats> {
  const { company } = await requireOwner();
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const [
    { count: enquiries },
    { count: booked },
    { count: openQuotes },
    { data: payments },
    { data: overdue },
  ] = await Promise.all([
    supabase
      .from("front_office_conversations")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company.id)
      .eq("direction", "in")
      .gte("created_at", since),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company.id)
      .neq("status", "canceled")
      .gte("created_at", since),
    supabase
      .from("quotes")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company.id)
      .eq("status", "sent"),
    supabase
      .from("payments")
      .select("amount_cents")
      .eq("company_id", company.id)
      .eq("status", "succeeded")
      .gte("created_at", since),
    supabase
      .from("invoices")
      .select("total_cents, amount_paid_cents")
      .eq("company_id", company.id)
      .eq("status", "overdue"),
  ]);

  const collectedCents7d = (payments ?? []).reduce(
    (sum, p) => sum + (p.amount_cents ?? 0),
    0,
  );
  const overdueCents = (overdue ?? []).reduce(
    (sum, i) => sum + (i.total_cents ?? 0) - (i.amount_paid_cents ?? 0),
    0,
  );

  return {
    enquiries7d: enquiries ?? 0,
    booked7d: booked ?? 0,
    openQuotes: openQuotes ?? 0,
    collectedCents7d,
    overdueCount: overdue?.length ?? 0,
    overdueCents,
  };
}

export type EscalationView = {
  id: string;
  kind: "off_price_quote" | "unusual";
  title: string;
  detail: string;
  payload: Record<string, unknown>;
  status: string;
  created_at: string;
  resolved_at: string | null;
};

/** Owner-only: the "Needs your OK" queue — pending first, then resolved. */
export async function getFrontOfficeEscalations(): Promise<EscalationView[]> {
  const { company } = await requireOwner();
  const supabase = await createClient();
  const { data } = await supabase
    .from("front_office_escalations")
    .select("id, kind, title, detail, payload, status, created_at, resolved_at")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as EscalationView[];
  return rows.sort((a, b) =>
    a.status === "pending" && b.status !== "pending"
      ? -1
      : a.status !== "pending" && b.status === "pending"
        ? 1
        : 0,
  );
}

const resolutionSchema = z.object({
  id: z.string().uuid(),
  resolution: z.enum(["approved", "edited", "declined"]),
  editedDetail: z.string().trim().max(2000).default(""),
});

/**
 * Owner-only: resolve an escalation. "approved" green-lights the assistant's
 * proposal; "edited" records the owner's corrected version alongside the
 * original; "declined" drops it. Either way the assistant is told.
 */
export async function resolveFrontOfficeEscalation(
  input: z.infer<typeof resolutionSchema>,
): Promise<{ ok: boolean; error?: string }> {
  const { company } = await requireOwner();
  const parsed = resolutionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid resolution." };
  const { id, resolution, editedDetail } = parsed.data;
  if (resolution === "edited" && !editedDetail) {
    return { ok: false, error: "Describe your correction before saving." };
  }
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("front_office_escalations")
    .select("id, payload")
    .eq("id", id)
    .eq("company_id", company.id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Escalation not found." };
  const payload = {
    ...((existing.payload as Record<string, unknown>) ?? {}),
    ...(resolution === "edited" ? { owner_edit: editedDetail } : {}),
  };
  const { error } = await supabase
    .from("front_office_escalations")
    .update({
      status: resolution,
      payload,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Couldn't save your decision." };
  revalidatePath("/dashboard/front-office");
  return { ok: true };
}

export type ConversationView = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  channel: string;
  direction: string;
  body: string;
  created_at: string;
};

/** Owner-only: conversation log, optionally filtered to one customer. */
export async function getFrontOfficeConversations(
  customerId?: string,
): Promise<ConversationView[]> {
  const { company } = await requireOwner();
  const supabase = await createClient();
  let query = supabase
    .from("front_office_conversations")
    .select("id, customer_id, channel, direction, body, created_at, customers(name)")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (customerId) query = query.eq("customer_id", customerId);
  const { data } = await query;
  return (data ?? []).map((c) => ({
    id: c.id as string,
    customer_id: c.customer_id as string | null,
    customer_name:
      one(c.customers as { name: string } | { name: string }[] | null)?.name ??
      "Unknown customer",
    channel: c.channel as string,
    direction: c.direction as string,
    body: c.body as string,
    created_at: c.created_at as string,
  }));
}

/** Owner-only: customers that have at least one logged conversation. */
export async function getConversationCustomers(): Promise<
  { id: string; name: string }[]
> {
  const { company } = await requireOwner();
  const supabase = await createClient();
  const { data } = await supabase
    .from("front_office_conversations")
    .select("customer_id, customers!inner(id, name)")
    .eq("company_id", company.id)
    .not("customer_id", "is", null)
    .limit(500);
  const seen = new Map<string, string>();
  for (const row of data ?? []) {
    const c = one(
      row.customers as { id: string; name: string } | { id: string; name: string }[] | null,
    );
    if (c && !seen.has(c.id)) seen.set(c.id, c.name);
  }
  return [...seen.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
