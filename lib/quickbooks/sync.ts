/**
 * QuickBooks sync: TidyPro → QBO for customers and invoices,
 * QBO → TidyPro for payments.
 *
 * Conflict policy: TidyPro is the operational source of truth. Pushes are
 * fire-and-forget from the UI's perspective — a failed push never blocks
 * saving the local record; it is logged and surfaced as a "Failed" badge
 * with a retry.
 */
import { createServiceClient } from "@/lib/supabase/server";
import { getQboClient, isQboAuthError } from "./tokens";
import { QboClient, QboError, QboEntity } from "./client";
import { qboDefaultItemName } from "./config";

export type SyncOutcome =
  | { ok: true; qboId: string }
  | { ok: false; reason: "not_connected" | "not_configured" | "error"; message?: string };

type LocalCustomer = {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  customer_type: string | null;
  qbo_id: string | null;
};

type LocalInvoice = {
  id: string;
  company_id: string;
  customer_id: string;
  invoice_number: string;
  status: string;
  total_cents: number;
  due_date: string | null;
  created_at: string;
  qbo_id: string | null;
};

type LocalLineItem = {
  label: string;
  qty: number;
  unit_price_cents: number;
  line_total_cents: number;
  sort: number;
};

async function logSync(
  companyId: string,
  entity: "customer" | "invoice" | "payment",
  entityId: string | null,
  direction: "push" | "pull",
  status: "ok" | "failed",
  detail: Record<string, unknown> = {},
): Promise<void> {
  try {
    const supabase = await createServiceClient();
    await supabase.from("quickbooks_sync_log").insert({
      company_id: companyId,
      entity,
      entity_id: entityId,
      direction,
      status,
      detail,
    });
  } catch {
    /* logging must never break the sync itself */
  }
}

const centsToDollars = (cents: number) => Math.round(cents) / 100;

/** Ensure the service Item exists in QBO; cache its id on the connection row. */
async function ensureServiceItem(
  client: QboClient,
  companyId: string,
  qboItemId: string | null,
): Promise<string> {
  if (qboItemId) return qboItemId;
  const name = qboDefaultItemName();
  const existing = await client.query<QboEntity>(
    `select * from Item where Name = '${name.replace(/'/g, "\\'")}'`,
  );
  if (existing[0]?.Id) {
    await cacheItemId(companyId, String(existing[0].Id));
    return String(existing[0].Id);
  }
  // Create the item against the first active income account.
  const accounts = await client.query<QboEntity>(
    "select * from Account where AccountType = 'Income' and Active = true maxresults 1",
  );
  const incomeAccount = accounts[0];
  if (!incomeAccount?.Id) {
    throw new QboError("No active income account found in QuickBooks", 422, "NO_INCOME_ACCOUNT");
  }
  const created = await client.request("POST", `/item?minorversion=75`, {
    Name: name,
    Type: "Service",
    IncomeAccountRef: { value: String(incomeAccount.Id) },
  });
  const id = String((created.Item as QboEntity)?.Id ?? "");
  if (!id) throw new QboError("Could not create service item in QuickBooks", 422, "ITEM_CREATE_FAILED");
  await cacheItemId(companyId, id);
  return id;
}

async function cacheItemId(companyId: string, itemId: string): Promise<void> {
  const supabase = await createServiceClient();
  await supabase
    .from("quickbooks_connections")
    .update({ qbo_item_id: itemId, updated_at: new Date().toISOString() })
    .eq("company_id", companyId);
}

// ---------------------------------------------------------------------------
// Customer push
// ---------------------------------------------------------------------------

function customerPayload(c: LocalCustomer): QboEntity {
  const payload: QboEntity = {
    DisplayName: c.name.slice(0, 100),
  };
  if (c.email) payload.PrimaryEmailAddr = { Address: c.email };
  if (c.phone) payload.PrimaryPhone = { FreeFormNumber: c.phone };
  if (c.customer_type === "commercial") payload.CompanyName = c.name.slice(0, 100);
  return payload;
}

export async function pushCustomer(customerId: string): Promise<SyncOutcome> {
  const supabase = await createServiceClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id, company_id, name, email, phone, customer_type, qbo_id")
    .eq("id", customerId)
    .maybeSingle<LocalCustomer>();
  if (!customer) return { ok: false, reason: "error", message: "Customer not found" };

  const ctx = await getQboClient(customer.company_id);
  if (!ctx) return { ok: false, reason: "not_connected" };
  const { client } = ctx;

  try {
    let qboId = customer.qbo_id;
    if (!qboId && customer.email) {
      const found = await client.query<QboEntity>(
        `select * from Customer where PrimaryEmailAddr = '${customer.email.replace(/'/g, "\\'")}' maxresults 1`,
      );
      if (found[0]?.Id) qboId = String(found[0].Id);
    }
    if (qboId) {
      const existing = await client.query<QboEntity>(
        `select * from Customer where Id = '${qboId}' maxresults 1`,
      );
      const current = existing[0];
      if (current?.Id && current?.SyncToken) {
        await client.sparseUpdate("customer", {
          ...customerPayload(customer),
          Id: String(current.Id),
          SyncToken: String(current.SyncToken),
        });
      } else {
        qboId = null; // stale reference; fall through to create
      }
    }
    if (!qboId) {
      const created = await client.create("customer", customerPayload(customer));
      qboId = String(created.Id ?? "");
      if (!qboId) throw new QboError("QuickBooks did not return a customer id", 422);
    }
    await supabase.from("customers").update({ qbo_id: qboId }).eq("id", customer.id);
    await logSync(customer.company_id, "customer", customer.id, "push", "ok", { qboId });
    return { ok: true, qboId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logSync(customer.company_id, "customer", customer.id, "push", "failed", { message });
    if (isQboAuthError(err)) return { ok: false, reason: "not_connected" };
    return { ok: false, reason: "error", message };
  }
}

// ---------------------------------------------------------------------------
// Invoice push
// ---------------------------------------------------------------------------

function invoicePayload(
  invoice: LocalInvoice,
  customerQboId: string,
  itemId: string,
  lines: LocalLineItem[],
): QboEntity {
  return {
    CustomerRef: { value: customerQboId },
    DocNumber: invoice.invoice_number,
    TxnDate: invoice.created_at.slice(0, 10),
    ...(invoice.due_date ? { DueDate: invoice.due_date } : {}),
    Line: lines.map((l) => ({
      Amount: centsToDollars(l.line_total_cents),
      DetailType: "SalesItemLineDetail",
      Description: l.label.slice(0, 4000),
      SalesItemLineDetail: {
        Qty: Number(l.qty),
        UnitPrice: centsToDollars(l.unit_price_cents),
        ItemRef: { value: itemId },
      },
    })),
  };
}

export async function pushInvoice(invoiceId: string): Promise<SyncOutcome> {
  const supabase = await createServiceClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, company_id, customer_id, invoice_number, status, total_cents, due_date, created_at, qbo_id")
    .eq("id", invoiceId)
    .maybeSingle<LocalInvoice>();
  if (!invoice) return { ok: false, reason: "error", message: "Invoice not found" };
  if (invoice.status === "draft") {
    return { ok: false, reason: "error", message: "Draft invoices are not synced" };
  }

  const ctx = await getQboClient(invoice.company_id);
  if (!ctx) return { ok: false, reason: "not_connected" };
  const { client, connection } = ctx;

  try {
    // The customer must exist in QBO first.
    const { data: customer } = await supabase
      .from("customers")
      .select("id, qbo_id")
      .eq("id", invoice.customer_id)
      .maybeSingle<{ id: string; qbo_id: string | null }>();
    let customerQboId = customer?.qbo_id ?? null;
    if (!customerQboId) {
      const pushed = await pushCustomer(invoice.customer_id);
      if (!pushed.ok || !pushed.qboId) {
        throw new QboError("Customer sync failed; invoice not pushed", 422, "CUSTOMER_PUSH_FAILED");
      }
      customerQboId = pushed.qboId;
    }

    const { data: lines } = await supabase
      .from("invoice_line_items")
      .select("label, qty, unit_price_cents, line_total_cents, sort")
      .eq("invoice_id", invoice.id)
      .order("sort", { ascending: true });
    const itemId = await ensureServiceItem(client, invoice.company_id, connection.qbo_item_id ?? null);

    let qboId = invoice.qbo_id;
    if (qboId) {
      const existing = await client.query<QboEntity>(
        `select * from Invoice where Id = '${qboId}' maxresults 1`,
      );
      const current = existing[0];
      if (current?.Id && current?.SyncToken) {
        if (invoice.status === "void") {
          await client.request("POST", `/invoice?minorversion=75&operation=void`, {
            Id: String(current.Id),
            SyncToken: String(current.SyncToken),
          });
        } else {
          await client.sparseUpdate("invoice", {
            ...invoicePayload(invoice, customerQboId, itemId, (lines ?? []) as LocalLineItem[]),
            Id: String(current.Id),
            SyncToken: String(current.SyncToken),
          });
        }
      } else {
        qboId = null;
      }
    }
    if (!qboId && invoice.status !== "void") {
      const created = await client.create("invoice", invoicePayload(invoice, customerQboId, itemId, (lines ?? []) as LocalLineItem[]));
      qboId = String(created.Id ?? "");
      if (!qboId) throw new QboError("QuickBooks did not return an invoice id", 422);
      await supabase.from("invoices").update({ qbo_id: qboId }).eq("id", invoice.id);
    }
    await logSync(invoice.company_id, "invoice", invoice.id, "push", "ok", { qboId });
    await supabase
      .from("quickbooks_connections")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("company_id", invoice.company_id);
    return { ok: true, qboId: qboId ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logSync(invoice.company_id, "invoice", invoice.id, "push", "failed", { message });
    if (isQboAuthError(err)) return { ok: false, reason: "not_connected" };
    return { ok: false, reason: "error", message };
  }
}

// ---------------------------------------------------------------------------
// Payment pull (QBO → TidyPro)
// ---------------------------------------------------------------------------

export async function pullPayments(companyId: string): Promise<{
  pulled: number;
  outcome: SyncOutcome;
}> {
  const ctx = await getQboClient(companyId);
  if (!ctx) return { pulled: 0, outcome: { ok: false, reason: "not_connected" } };
  const { client } = ctx;
  const supabase = await createServiceClient();

  try {
    const { data: conn } = await supabase
      .from("quickbooks_connections")
      .select("last_sync_at")
      .eq("company_id", companyId)
      .maybeSingle<{ last_sync_at: string | null }>();
    const since = conn?.last_sync_at ?? new Date(Date.now() - 30 * 86400000).toISOString();
    const payments = await client.query<QboEntity>(
      `select * from Payment where MetaData.LastUpdatedTime > '${since}' maxresults 500`,
    );

    let pulled = 0;
    for (const p of payments) {
      const qboPaymentId = String(p.Id ?? "");
      const total = Number((p.TotalAmt as number | undefined) ?? 0);
      const lines = (p.Line as { LinkedTxn?: { TxnId?: string } }[] | undefined) ?? [];
      const linkedInvoiceId = lines[0]?.LinkedTxn?.TxnId ? String(lines[0].LinkedTxn.TxnId) : null;
      if (!qboPaymentId || !linkedInvoiceId || total <= 0) continue;

      const { data: invoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("company_id", companyId)
        .eq("qbo_id", linkedInvoiceId)
        .maybeSingle<{ id: string }>();
      if (!invoice) continue;

      const { error } = await supabase.from("payments").insert({
        company_id: companyId,
        invoice_id: invoice.id,
        amount_cents: Math.round(total * 100),
        status: "succeeded",
        provider: "quickbooks",
        provider_ref: qboPaymentId,
        qbo_id: qboPaymentId,
      });
      if (!error) {
        pulled += 1;
        await logSync(companyId, "payment", null, "pull", "ok", {
          qboPaymentId,
          invoiceId: invoice.id,
          amountCents: Math.round(total * 100),
        });
      }
      // Unique index on (company_id, qbo_id) makes re-pulls idempotent;
      // duplicate inserts fail silently here by design.
    }

    await supabase
      .from("quickbooks_connections")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("company_id", companyId);
    return { pulled, outcome: { ok: true, qboId: "" } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logSync(companyId, "payment", null, "pull", "failed", { message });
    if (isQboAuthError(err)) return { pulled: 0, outcome: { ok: false, reason: "not_connected" } };
    return { pulled: 0, outcome: { ok: false, reason: "error", message } };
  }
}

// ---------------------------------------------------------------------------
// Sync status for UI badges
// ---------------------------------------------------------------------------

export type InvoiceSyncStatus = "not_connected" | "unsynced" | "synced" | "failed";

async function hasActiveConnection(companyId: string): Promise<boolean> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("quickbooks_connections")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "active")
    .maybeSingle();
  return Boolean(data);
}

/**
 * Badge statuses for a page of invoices with a single round trip.
 * Returns null when there is no active connection (caller renders no badges).
 */
export async function getQboBadgeMap(
  companyId: string,
  invoices: { id: string; qbo_id: string | null }[],
): Promise<Map<string, Exclude<InvoiceSyncStatus, "not_connected">> | null> {
  if (invoices.length === 0) return new Map();
  if (!(await hasActiveConnection(companyId))) return null;

  const supabase = await createServiceClient();
  const ids = invoices.map((i) => i.id);
  const { data: failures } = await supabase
    .from("quickbooks_sync_log")
    .select("entity_id")
    .eq("company_id", companyId)
    .eq("entity", "invoice")
    .eq("direction", "push")
    .eq("status", "failed")
    .in("entity_id", ids);
  const failedIds = new Set((failures ?? []).map((f) => f.entity_id as string));

  const map = new Map<string, Exclude<InvoiceSyncStatus, "not_connected">>();
  for (const inv of invoices) {
    if (inv.qbo_id) map.set(inv.id, "synced");
    else if (failedIds.has(inv.id)) map.set(inv.id, "failed");
    else map.set(inv.id, "unsynced");
  }
  return map;
}

export async function getInvoiceSyncStatus(
  companyId: string,
  invoice: { id: string; qbo_id: string | null },
): Promise<InvoiceSyncStatus> {
  const found = await getQboClient(companyId);
  if (!found) return "not_connected";
  if (invoice.qbo_id) return "synced";
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("quickbooks_sync_log")
    .select("id")
    .eq("company_id", companyId)
    .eq("entity", "invoice")
    .eq("entity_id", invoice.id)
    .eq("direction", "push")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? "failed" : "unsynced";
}
