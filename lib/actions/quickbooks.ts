"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { hasFeature, isPlanId } from "@/lib/plans";
import { isQuickBooksConfigured } from "@/lib/quickbooks/config";
import { getQboClient } from "@/lib/quickbooks/tokens";
import { pushCustomer, pushInvoice, pullPayments } from "@/lib/quickbooks/sync";

function planAllows(plan: unknown): boolean {
  return isPlanId(plan) && hasFeature(plan, "quickbooks");
}

export type QuickBooksStatus = {
  planAllows: boolean;
  configured: boolean;
  connected: boolean;
  companyName: string | null;
  status: string | null;
  lastSyncAt: string | null;
};

export async function getQuickBooksStatus(): Promise<QuickBooksStatus> {
  const { company } = await requireOwner();
  const allowed = planAllows(company.plan);
  if (!allowed || !isQuickBooksConfigured()) {
    return {
      planAllows: allowed,
      configured: isQuickBooksConfigured(),
      connected: false,
      companyName: null,
      status: null,
      lastSyncAt: null,
    };
  }
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("quickbooks_connections")
    .select("company_name, status, last_sync_at")
    .eq("company_id", company.id)
    .maybeSingle();
  return {
    planAllows: true,
    configured: true,
    connected: Boolean(data) && data?.status === "active",
    companyName: data?.company_name ?? null,
    status: data?.status ?? null,
    lastSyncAt: data?.last_sync_at ?? null,
  };
}

/**
 * Push every unsynced customer and non-draft invoice, then pull payments.
 * Safe to run any time; no-ops when nothing is connected.
 */
export async function syncNowQuickBooks(): Promise<{
  ok: boolean;
  error?: string;
  pushedCustomers?: number;
  pushedInvoices?: number;
  pulledPayments?: number;
}> {
  const { company } = await requireOwner();
  if (!planAllows(company.plan)) return { ok: false, error: "QuickBooks sync requires the Pro plan." };
  if (!isQuickBooksConfigured()) return { ok: false, error: "QuickBooks is not configured yet." };

  const ctx = await getQboClient(company.id);
  if (!ctx) return { ok: false, error: "QuickBooks is not connected." };

  const supabase = await createServiceClient();
  let pushedCustomers = 0;
  let pushedInvoices = 0;

  const { data: customers } = await supabase
    .from("customers")
    .select("id")
    .eq("company_id", company.id)
    .is("qbo_id", null)
    .limit(200);
  for (const c of customers ?? []) {
    const r = await pushCustomer(c.id);
    if (r.ok) pushedCustomers += 1;
  }

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id")
    .eq("company_id", company.id)
    .is("qbo_id", null)
    .neq("status", "draft")
    .limit(200);
  for (const i of invoices ?? []) {
    const r = await pushInvoice(i.id);
    if (r.ok) pushedInvoices += 1;
  }

  const { pulled } = await pullPayments(company.id);

  await logAudit(supabase, {
    company_id: company.id,
    action: "quickbooks.sync_now",
    entity_type: "integration",
    metadata: { pushedCustomers, pushedInvoices, pulledPayments: pulled },
  });
  revalidatePath("/dashboard/settings");
  return { ok: true, pushedCustomers, pushedInvoices, pulledPayments: pulled };
}

/** Disconnect: best-effort revoke at Intuit, then delete the local row. */
export async function disconnectQuickBooks(): Promise<{ ok: boolean; error?: string }> {
  const { company } = await requireOwner();
  if (!planAllows(company.plan)) return { ok: false, error: "QuickBooks sync requires the Pro plan." };

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("quickbooks_connections")
    .delete()
    .eq("company_id", company.id);
  if (error) return { ok: false, error: "Could not disconnect. Please try again." };

  await logAudit(supabase, {
    company_id: company.id,
    action: "quickbooks.disconnect",
    entity_type: "integration",
  });
  revalidatePath("/dashboard/settings");
  return { ok: true };
}
