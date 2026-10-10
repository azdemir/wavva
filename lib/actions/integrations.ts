"use server";

import { revalidatePath } from "next/cache";
import { requireCompany } from "@/lib/auth";
import { NOT_PERMITTED } from "@/lib/permissions";
import { createServiceClient } from "@/lib/supabase/server";
import {
  encryptToken,
  decryptToken,
  encryptionKeyAvailable,
} from "@/lib/import/encryption";
import {
  validateApiKey,
  listAudiences,
  upsertMember,
  type MailchimpAudience,
  type SyncCustomer,
} from "@/lib/integrations/mailchimp";
import { EVENT_NAMES } from "@/lib/integrations/webhooks";

export type ActionResult = { error?: string; ok?: boolean; setupRequired?: boolean };

type MailchimpConfig = { api_key: string; dc: string };
type MailchimpMeta = {
  audience_id?: string;
  audience_name?: string;
  account_name?: string;
};

export type MailchimpState = {
  connected: boolean;
  accountName: string | null;
  audienceId: string | null;
  audienceName: string | null;
  audiences: MailchimpAudience[];
};

export type IntegrationWebhook = {
  id: string;
  name: string;
  urlMasked: string;
  events: string[];
  active: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
};

export type IntegrationState = {
  mailchimp: MailchimpState;
  webhooks: IntegrationWebhook[];
};

const SETUP_ERROR = "SETUP_REQUIRED";

/** True when the 0016 tables don't exist yet on the database. */
function missingTable(error: unknown): boolean {
  const err = error as { code?: string; message?: string } | null;
  return (
    err?.code === "42P01" ||
    err?.code === "PGRST205" ||
    /relation "?(integration_connections|integration_webhooks)"? does not exist/i.test(
      err?.message ?? "",
    )
  );
}

async function requireOwner() {
  const ctx = await requireCompany();
  if (ctx.membership.role !== "owner") return { ctx: null, error: NOT_PERMITTED as string };
  return { ctx, error: null as string | null };
}

type ConnectionRow = {
  config_enc: string | null;
  meta: MailchimpMeta | null;
};

async function getMailchimpConnection(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  companyId: string,
): Promise<ConnectionRow | null> {
  const { data } = await supabase
    .from("integration_connections")
    .select("config_enc, meta")
    .eq("company_id", companyId)
    .eq("provider", "mailchimp")
    .maybeSingle();
  return (data as ConnectionRow | null) ?? null;
}

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/…`;
  } catch {
    return "…";
  }
}

/** Page loader: never throws; reports setupRequired when migration 0016 hasn't run. */
export async function getIntegrationState(): Promise<
  { setupRequired: true } | ({ setupRequired: false } & IntegrationState)
> {
  const { ctx } = await requireOwner();
  if (!ctx) {
    // Cleaners/managers are redirected by the page guard; this is a fallback.
    return {
      setupRequired: false,
      mailchimp: {
        connected: false,
        accountName: null,
        audienceId: null,
        audienceName: null,
        audiences: [],
      },
      webhooks: [],
    };
  }
  const supabase = await createServiceClient();

  const { data: conn, error: connErr } = await supabase
    .from("integration_connections")
    .select("config_enc, meta")
    .eq("company_id", ctx.company.id)
    .eq("provider", "mailchimp")
    .maybeSingle();
  const { data: hooks, error: hooksErr } = await supabase
    .from("integration_webhooks")
    .select("id, name, url_enc, events, active, last_triggered_at, created_at")
    .eq("company_id", ctx.company.id)
    .order("created_at", { ascending: true });
  if ((connErr && missingTable(connErr)) || (hooksErr && missingTable(hooksErr))) {
    return { setupRequired: true };
  }

  const connection = (conn as ConnectionRow | null) ?? null;
  const mailchimp: MailchimpState = {
    connected: !!connection,
    accountName: (connection?.meta as MailchimpMeta | null)?.account_name ?? null,
    audienceId: (connection?.meta as MailchimpMeta | null)?.audience_id ?? null,
    audienceName: (connection?.meta as MailchimpMeta | null)?.audience_name ?? null,
    audiences: [],
  };
  // Refresh the audience list live so member counts stay current.
  if (connection?.config_enc) {
    try {
      const config = JSON.parse(decryptToken(connection.config_enc)) as MailchimpConfig;
      mailchimp.audiences = await listAudiences(config.dc, config.api_key);
    } catch {
      // Keep the connected state; the UI shows the stored audience name.
    }
  }

  const webhooks: IntegrationWebhook[] = (
    (hooks ?? []) as {
      id: string;
      name: string;
      url_enc: string;
      events: string[] | null;
      active: boolean;
      last_triggered_at: string | null;
      created_at: string;
    }[]
  ).map((h) => {
    let urlMasked = "…";
    try {
      urlMasked = maskUrl(decryptToken(h.url_enc));
    } catch {
      urlMasked = "…";
    }
    return {
      id: h.id,
      name: h.name,
      urlMasked,
      events: h.events ?? [],
      active: h.active,
      lastTriggeredAt: h.last_triggered_at,
      createdAt: h.created_at,
    };
  });

  return { setupRequired: false, mailchimp, webhooks };
}

/** Validate the key against Mailchimp, then store it encrypted. */
export async function connectMailchimp(apiKey: string): Promise<
  ActionResult & { audiences?: MailchimpAudience[] }
> {
  const { ctx, error } = await requireOwner();
  if (!ctx) return { error: error ?? NOT_PERMITTED };
  if (!encryptionKeyAvailable()) return { error: "ENCRYPTION_KEY_MISSING" };
  const key = (apiKey ?? "").trim();
  if (!key) return { error: "API_KEY_REQUIRED" };

  let account;
  try {
    account = await validateApiKey(key);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createServiceClient();
  const configEnc = encryptToken(JSON.stringify({ api_key: key, dc: account.dc }));
  const { error: upErr } = await supabase.from("integration_connections").upsert(
    {
      company_id: ctx.company.id,
      provider: "mailchimp",
      status: "connected",
      config_enc: configEnc,
      meta: { account_name: account.accountName },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id,provider" },
  );
  if (upErr) return missingTable(upErr) ? { error: SETUP_ERROR, setupRequired: true } : { error: upErr.message };

  let audiences: MailchimpAudience[] = [];
  try {
    audiences = await listAudiences(account.dc, key);
  } catch {
    // Connection is stored; audience fetch can be retried from the UI.
  }
  revalidatePath("/dashboard/integrations");
  return { ok: true, audiences };
}

export async function disconnectMailchimp(): Promise<ActionResult> {
  const { ctx, error } = await requireOwner();
  if (!ctx) return { error: error ?? NOT_PERMITTED };
  const supabase = await createServiceClient();
  const { error: delErr } = await supabase
    .from("integration_connections")
    .delete()
    .eq("company_id", ctx.company.id)
    .eq("provider", "mailchimp");
  if (delErr) return missingTable(delErr) ? { error: SETUP_ERROR, setupRequired: true } : { error: delErr.message };
  revalidatePath("/dashboard/integrations");
  return { ok: true };
}

export async function setMailchimpAudience(
  audienceId: string,
  audienceName: string,
): Promise<ActionResult> {
  const { ctx, error } = await requireOwner();
  if (!ctx) return { error: error ?? NOT_PERMITTED };
  const supabase = await createServiceClient();
  const connection = await getMailchimpConnection(supabase, ctx.company.id);
  if (!connection) return { error: "NOT_CONNECTED" };
  const { error: updErr } = await supabase
    .from("integration_connections")
    .update({
      meta: { ...(connection.meta ?? {}), audience_id: audienceId, audience_name: audienceName },
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", ctx.company.id)
    .eq("provider", "mailchimp");
  if (updErr) return missingTable(updErr) ? { error: SETUP_ERROR, setupRequired: true } : { error: updErr.message };
  revalidatePath("/dashboard/integrations");
  return { ok: true };
}

/**
 * Manual one-way push of customers into the chosen Mailchimp audience.
 * Uses status_if_new so unsubscribed members are never resubscribed.
 */
export async function syncMailchimpCustomers(): Promise<
  ActionResult & { synced?: number; skipped?: number; errors?: number }
> {
  const { ctx, error } = await requireOwner();
  if (!ctx) return { error: error ?? NOT_PERMITTED };
  if (!encryptionKeyAvailable()) return { error: "ENCRYPTION_KEY_MISSING" };
  const supabase = await createServiceClient();
  const connection = await getMailchimpConnection(supabase, ctx.company.id);
  if (!connection?.config_enc) return { error: "NOT_CONNECTED" };
  const meta = (connection.meta ?? {}) as MailchimpMeta;
  if (!meta.audience_id) return { error: "NO_AUDIENCE" };

  let config: MailchimpConfig;
  try {
    config = JSON.parse(decryptToken(connection.config_enc)) as MailchimpConfig;
  } catch {
    return { error: "DECRYPT_FAILED" };
  }

  const { data: customers, error: custErr } = await supabase
    .from("customers")
    .select("email, first_name, last_name, name")
    .eq("company_id", ctx.company.id)
    .not("email", "is", null)
    .limit(2000);
  if (custErr) return { error: custErr.message };

  let synced = 0;
  let skipped = 0;
  let errors = 0;
  for (const c of (customers ?? []) as {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    name: string;
  }[]) {
    if (!c.email || !c.email.includes("@")) {
      skipped += 1;
      continue;
    }
    const payload: SyncCustomer = {
      email: c.email,
      firstName: c.first_name,
      lastName: c.last_name,
      phone: null,
    };
    try {
      await upsertMember(config.dc, config.api_key, meta.audience_id!, payload);
      synced += 1;
    } catch {
      errors += 1;
    }
    // Courtesy delay so a large list doesn't hammer the Mailchimp API.
    await new Promise((r) => setTimeout(r, 200));
  }
  revalidatePath("/dashboard/integrations");
  return { ok: true, synced, skipped, errors };
}

const MAX_WEBHOOKS = 10;

function validateWebhookUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Add an outgoing webhook (Zapier "Catch Hook" URL, or Make/n8n equivalent). */
export async function saveZapierWebhook(input: {
  name: string;
  url: string;
  events: string[];
}): Promise<ActionResult> {
  const { ctx, error } = await requireOwner();
  if (!ctx) return { error: error ?? NOT_PERMITTED };
  if (!encryptionKeyAvailable()) return { error: "ENCRYPTION_KEY_MISSING" };
  const name = (input.name ?? "").trim().slice(0, 80);
  const url = validateWebhookUrl(input.url ?? "");
  const events = (input.events ?? []).filter((e) => EVENT_NAMES.has(e));
  if (!name) return { error: "NAME_REQUIRED" };
  if (!url) return { error: "URL_HTTPS_REQUIRED" };
  if (events.length === 0) return { error: "EVENTS_REQUIRED" };

  const supabase = await createServiceClient();
  const { count } = await supabase
    .from("integration_webhooks")
    .select("id", { count: "exact", head: true })
    .eq("company_id", ctx.company.id);
  if ((count ?? 0) >= MAX_WEBHOOKS) return { error: "TOO_MANY_WEBHOOKS" };

  const { error: insErr } = await supabase.from("integration_webhooks").insert({
    company_id: ctx.company.id,
    name,
    url_enc: encryptToken(url),
    events,
    active: true,
  });
  if (insErr) return missingTable(insErr) ? { error: SETUP_ERROR, setupRequired: true } : { error: insErr.message };
  revalidatePath("/dashboard/integrations");
  return { ok: true };
}

/** Toggle active, rename, or change the subscribed events of a webhook. */
export async function updateZapierWebhook(
  id: string,
  patch: { name?: string; events?: string[]; active?: boolean },
): Promise<ActionResult> {
  const { ctx, error } = await requireOwner();
  if (!ctx) return { error: error ?? NOT_PERMITTED };
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    const name = patch.name.trim().slice(0, 80);
    if (!name) return { error: "NAME_REQUIRED" };
    update.name = name;
  }
  if (patch.events !== undefined) {
    const events = patch.events.filter((e) => EVENT_NAMES.has(e));
    if (events.length === 0) return { error: "EVENTS_REQUIRED" };
    update.events = events;
  }
  if (patch.active !== undefined) update.active = patch.active;
  if (Object.keys(update).length === 0) return { ok: true };

  const supabase = await createServiceClient();
  const { error: updErr } = await supabase
    .from("integration_webhooks")
    .update(update)
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (updErr) return missingTable(updErr) ? { error: SETUP_ERROR, setupRequired: true } : { error: updErr.message };
  revalidatePath("/dashboard/integrations");
  return { ok: true };
}

export async function deleteZapierWebhook(id: string): Promise<ActionResult> {
  const { ctx, error } = await requireOwner();
  if (!ctx) return { error: error ?? NOT_PERMITTED };
  const supabase = await createServiceClient();
  const { error: delErr } = await supabase
    .from("integration_webhooks")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (delErr) return missingTable(delErr) ? { error: SETUP_ERROR, setupRequired: true } : { error: delErr.message };
  revalidatePath("/dashboard/integrations");
  return { ok: true };
}

/** POST a sample payload to a webhook so the user can confirm the Zap receives it. */
export async function testZapierWebhook(id: string): Promise<ActionResult> {
  const { ctx, error } = await requireOwner();
  if (!ctx) return { error: error ?? NOT_PERMITTED };
  const supabase = await createServiceClient();
  const { data, error: selErr } = await supabase
    .from("integration_webhooks")
    .select("url_enc")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (selErr) return missingTable(selErr) ? { error: SETUP_ERROR, setupRequired: true } : { error: selErr.message };
  if (!data) return { error: "WEBHOOK_NOT_FOUND" };

  let url: string;
  try {
    url = decryptToken((data as { url_enc: string }).url_enc);
  } catch {
    return { error: "DECRYPT_FAILED" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "test",
        occurred_at: new Date().toISOString(),
        data: {
          message: "This is a test event from TidyPro. Your webhook is working.",
          company_id: ctx.company.id,
        },
      }),
      signal: controller.signal,
    });
    if (!res.ok) return { error: `TEST_FAILED_${res.status}` };
  } catch {
    return { error: "TEST_FAILED" };
  } finally {
    clearTimeout(timer);
  }
  revalidatePath("/dashboard/integrations");
  return { ok: true };
}
