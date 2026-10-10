"use server";

import { createClient } from "@/lib/supabase/server";
import { requireCompany } from "@/lib/auth";

/**
 * True when another customer in this company already uses the email address
 * (case-insensitive). Used by the customer create/update pages to block
 * duplicates with a clear message. Lives here — not in lib/actions/customers.ts
 * — so the in-flight QuickBooks work in that file stays untouched.
 */
export async function isCustomerEmailTaken(
  email: string,
  excludeId?: string,
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  const ctx = await requireCompany();
  const supabase = await createClient();
  // Escape LIKE wildcards so the match is literal.
  const pattern = normalized.replace(/[%_\\]/g, (c) => `\\${c}`);
  let query = supabase
    .from("customers")
    .select("id")
    .eq("company_id", ctx.company.id)
    .ilike("email", pattern)
    .limit(2);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;
  return (data ?? []).length > 0;
}
