import { requirePlatformAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { CRM_STAGES, type CrmContact, type CrmActivity } from "./crm";

/**
 * Server-only CRM data access. Lives apart from `@/lib/studio/crm` (which
 * must stay client-safe — the "new lead" page imports its constants).
 */

async function guardedService() {
  await requirePlatformAdmin();
  return createServiceClient();
}

/** All contacts with activity counts, newest first. */
export async function listCrmContacts(): Promise<CrmContact[]> {
  const svc = await guardedService();
  const { data, error } = await svc
    .from("crm_contacts")
    .select(
      "id, name, email, phone, company_name, source, stage, deal_value_cents, notes, created_at, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error || !data) return [];

  const ids = data.map((c) => c.id);
  const counts = new Map<string, number>();
  const lastAt = new Map<string, string>();
  if (ids.length > 0) {
    const { data: acts } = await svc
      .from("crm_activities")
      .select("contact_id, created_at")
      .in("contact_id", ids)
      .order("created_at", { ascending: false });
    for (const a of acts ?? []) {
      counts.set(a.contact_id, (counts.get(a.contact_id) ?? 0) + 1);
      if (!lastAt.has(a.contact_id)) lastAt.set(a.contact_id, a.created_at);
    }
  }

  return data.map((c) => ({
    ...c,
    activity_count: counts.get(c.id) ?? 0,
    last_activity_at: lastAt.get(c.id) ?? null,
  }));
}

export async function getCrmContact(id: string): Promise<{
  contact: CrmContact;
  activities: CrmActivity[];
} | null> {
  const svc = await guardedService();
  const { data: contact, error } = await svc
    .from("crm_contacts")
    .select(
      "id, name, email, phone, company_name, source, stage, deal_value_cents, notes, created_at, updated_at",
    )
    .eq("id", id)
    .single();
  if (error || !contact) return null;
  const { data: activities } = await svc
    .from("crm_activities")
    .select("id, contact_id, kind, body, created_by_email, created_at")
    .eq("contact_id", id)
    .order("created_at", { ascending: false })
    .limit(200);
  return { contact, activities: activities ?? [] };
}

/** Pipeline counts per stage for the kanban + HQ dashboard. */
export async function crmStageCounts(): Promise<Record<string, number>> {
  const svc = await guardedService();
  const { data } = await svc.from("crm_contacts").select("stage");
  const counts: Record<string, number> = {};
  for (const s of CRM_STAGES) counts[s.id] = 0;
  for (const row of data ?? []) {
    const st = (row as { stage: string }).stage;
    counts[st] = (counts[st] ?? 0) + 1;
  }
  return counts;
}
