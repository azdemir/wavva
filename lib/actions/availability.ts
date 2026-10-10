"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireCompany } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export type ActionResult = { error?: string; ok?: boolean; id?: string };
export type AvailabilityWindowInput = { weekday: number; start: string; end: string };
export type RosterMember = { id: string; email: string; role: string };
export type TimeOffRequest = {
  id: string;
  membership_id: string;
  email: string;
  role: string;
  starts_on: string;
  ends_on: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  created_at: string;
};

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

const windowSchema = z
  .array(
    z.object({
      weekday: z.number().int().min(0).max(6),
      start: z.string().regex(HHMM),
      end: z.string().regex(HHMM),
    }),
  )
  .max(28);

const timeOffSchema = z.object({
  startsOn: z.string().regex(DATE_ISO),
  endsOn: z.string().regex(DATE_ISO),
  reason: z.string().trim().max(500),
});

/** 42P01 = undefined_table; PGRST205 = table missing from the schema cache. */
function tableMissing(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === "42P01" || code === "PGRST205";
}

type Ctx = Awaited<ReturnType<typeof requireCompany>>;

/**
 * Resolve the target membership for an availability/PTO write.
 * Staff may act on any membership in their company; cleaners only on
 * their own. Returns null when not permitted.
 */
async function resolveTargetMembership(ctx: Ctx, membershipId: string) {
  if (!isStaff(ctx.membership.role) && membershipId !== ctx.membership.id) {
    return null;
  }
  const svc = await createServiceClient();
  const { data } = await svc
    .from("memberships")
    .select("id, email, role")
    .eq("id", membershipId)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  return data;
}

/** Staff-only roster for the availability member selector. */
export async function listAvailabilityRoster(): Promise<{
  members: RosterMember[];
  error?: string;
}> {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) return { members: [], error: undefined };
  const svc = await createServiceClient();
  const { data, error } = await svc
    .from("memberships")
    .select("id, email, role")
    .eq("company_id", ctx.company.id)
    .order("email");
  if (error) {
    if (tableMissing(error)) {
      const t = await getTranslations("availability");
      return { members: [], error: t("errors.migrationMissing") };
    }
    return { members: [], error: error.message };
  }
  return { members: (data ?? []) as RosterMember[] };
}

export async function getAvailability(membershipId: string): Promise<{
  windows: AvailabilityWindowInput[];
  error?: string;
}> {
  const ctx = await requireCompany();
  const target = await resolveTargetMembership(ctx, membershipId);
  if (!target) return { windows: [], error: undefined };

  const svc = await createServiceClient();
  const { data, error } = await svc
    .from("cleaner_availability")
    .select("weekday, start_time, end_time")
    .eq("company_id", ctx.company.id)
    .eq("membership_id", membershipId)
    .order("weekday")
    .order("start_time");
  if (error) {
    if (tableMissing(error)) {
      const t = await getTranslations("availability");
      return { windows: [], error: t("errors.migrationMissing") };
    }
    return { windows: [], error: error.message };
  }
  return {
    windows: (data ?? []).map((r) => ({
      weekday: r.weekday as number,
      start: (r.start_time as string).slice(0, 5),
      end: (r.end_time as string).slice(0, 5),
    })),
  };
}

/** Replace-all semantics per membership: delete existing windows, insert the new set. */
export async function saveAvailability(
  membershipId: string,
  windows: AvailabilityWindowInput[],
): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("availability");
  const target = await resolveTargetMembership(ctx, membershipId);
  if (!target) return { error: t("errors.notPermitted") };

  const parsed = windowSchema.safeParse(windows);
  if (!parsed.success) return { error: t("errors.invalidWindows") };
  for (const w of parsed.data) {
    if (w.end <= w.start) return { error: t("errors.endAfterStart") };
  }
  const perDay = new Map<number, number>();
  for (const w of parsed.data) {
    perDay.set(w.weekday, (perDay.get(w.weekday) ?? 0) + 1);
    if ((perDay.get(w.weekday) ?? 0) > 4) return { error: t("errors.maxWindows") };
  }

  const svc = await createServiceClient();
  const { error: delError } = await svc
    .from("cleaner_availability")
    .delete()
    .eq("company_id", ctx.company.id)
    .eq("membership_id", membershipId);
  if (delError) {
    if (tableMissing(delError)) return { error: t("errors.migrationMissing") };
    return { error: delError.message };
  }
  if (parsed.data.length > 0) {
    const { error: insError } = await svc.from("cleaner_availability").insert(
      parsed.data.map((w) => ({
        company_id: ctx.company.id,
        membership_id: membershipId,
        weekday: w.weekday,
        start_time: w.start,
        end_time: w.end,
      })),
    );
    if (insError) return { error: insError.message };
  }

  await logAudit(svc, {
    company_id: ctx.company.id,
    action: "availability.saved",
    entity_type: "membership",
    entity_id: membershipId,
    metadata: { windows: parsed.data.length },
  });
  revalidatePath("/dashboard/availability");
  return { ok: true };
}

function validateTimeOffInput(input: unknown, t: (key: string) => string) {
  const parsed = timeOffSchema.safeParse(input);
  if (!parsed.success) return { error: t("errors.invalidDates") };
  const { startsOn, endsOn } = parsed.data;
  if (endsOn < startsOn) return { error: t("errors.endAfterStart") };
  const today = new Date().toISOString().slice(0, 10);
  if (startsOn < today) return { error: t("errors.notInPast") };
  return { data: parsed.data };
}

/** A cleaner requests time off for their own membership. */
export async function requestTimeOff(input: unknown): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("availability");
  const validated = validateTimeOffInput(input, t as (key: string) => string);
  if ("error" in validated) return { error: validated.error };

  const svc = await createServiceClient();
  const { data, error } = await svc
    .from("time_off_requests")
    .insert({
      company_id: ctx.company.id,
      membership_id: ctx.membership.id,
      starts_on: validated.data.startsOn,
      ends_on: validated.data.endsOn,
      reason: validated.data.reason,
    })
    .select("id")
    .single();
  if (error) {
    if (tableMissing(error)) return { error: t("errors.migrationMissing") };
    return { error: error.message };
  }

  await logAudit(svc, {
    company_id: ctx.company.id,
    action: "time_off.requested",
    entity_type: "time_off_request",
    entity_id: data.id,
    metadata: { starts_on: validated.data.startsOn, ends_on: validated.data.endsOn },
  });
  revalidatePath("/dashboard/availability");
  return { ok: true, id: data.id };
}

/** Staff log time off for a member directly — created pre-approved. */
export async function addTimeOffForMember(
  membershipId: string,
  input: unknown,
): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("availability");
  if (!isStaff(ctx.membership.role)) return { error: t("errors.notPermitted") };
  const target = await resolveTargetMembership(ctx, membershipId);
  if (!target) return { error: t("errors.notPermitted") };
  const validated = validateTimeOffInput(input, t as (key: string) => string);
  if ("error" in validated) return { error: validated.error };

  const svc = await createServiceClient();
  const { data, error } = await svc
    .from("time_off_requests")
    .insert({
      company_id: ctx.company.id,
      membership_id: membershipId,
      starts_on: validated.data.startsOn,
      ends_on: validated.data.endsOn,
      reason: validated.data.reason,
      status: "approved",
      decided_by: ctx.user.id,
      decided_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) {
    if (tableMissing(error)) return { error: t("errors.migrationMissing") };
    return { error: error.message };
  }

  await logAudit(svc, {
    company_id: ctx.company.id,
    action: "time_off.logged",
    entity_type: "time_off_request",
    entity_id: data.id,
    metadata: {
      membership_id: membershipId,
      starts_on: validated.data.startsOn,
      ends_on: validated.data.endsOn,
    },
  });
  revalidatePath("/dashboard/availability");
  return { ok: true, id: data.id };
}

/** Staff see every request (pending first); cleaners see only their own. */
export async function listTimeOff(): Promise<{
  requests: TimeOffRequest[];
  error?: string;
}> {
  const ctx = await requireCompany();
  const svc = await createServiceClient();
  let query = svc
    .from("time_off_requests")
    .select("id, membership_id, starts_on, ends_on, reason, status, created_at, memberships(email, role)")
    .eq("company_id", ctx.company.id);
  if (!isStaff(ctx.membership.role)) query = query.eq("membership_id", ctx.membership.id);
  const { data, error } = await query;
  if (error) {
    if (tableMissing(error)) {
      const t = await getTranslations("availability");
      return { requests: [], error: t("errors.migrationMissing") };
    }
    return { requests: [], error: error.message };
  }
  const requests: TimeOffRequest[] = (data ?? []).map((r) => {
    const m = (Array.isArray(r.memberships) ? r.memberships[0] : r.memberships) as {
      email?: string;
      role?: string;
    } | null;
    return {
      id: r.id,
      membership_id: r.membership_id,
      email: m?.email ?? "",
      role: m?.role ?? "",
      starts_on: r.starts_on,
      ends_on: r.ends_on,
      reason: r.reason ?? "",
      status: r.status as TimeOffRequest["status"],
      created_at: r.created_at,
    };
  });
  // Pending first, then newest.
  const rank = { pending: 0, approved: 1, denied: 2 } as const;
  requests.sort(
    (a, b) => rank[a.status] - rank[b.status] || b.created_at.localeCompare(a.created_at),
  );
  return { requests };
}

/** Staff approve or deny a request. */
export async function decideTimeOff(
  id: string,
  decision: "approved" | "denied",
): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("availability");
  if (!isStaff(ctx.membership.role)) return { error: t("errors.notPermitted") };
  if (decision !== "approved" && decision !== "denied") return { error: t("errors.invalid") };

  const svc = await createServiceClient();
  const { error } = await svc
    .from("time_off_requests")
    .update({
      status: decision,
      decided_by: ctx.user.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) {
    if (tableMissing(error)) return { error: t("errors.migrationMissing") };
    return { error: error.message };
  }

  await logAudit(svc, {
    company_id: ctx.company.id,
    action: `time_off.${decision}`,
    entity_type: "time_off_request",
    entity_id: id,
  });
  revalidatePath("/dashboard/availability");
  return { ok: true };
}

/** Staff may delete any request; cleaners may delete only their own pending ones. */
export async function deleteTimeOff(id: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("availability");
  const svc = await createServiceClient();

  const { data: row, error: fetchError } = await svc
    .from("time_off_requests")
    .select("id, membership_id, status")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (fetchError) {
    if (tableMissing(fetchError)) return { error: t("errors.migrationMissing") };
    return { error: fetchError.message };
  }
  if (!row) return { error: t("errors.notFound") };
  if (
    !isStaff(ctx.membership.role) &&
    (row.membership_id !== ctx.membership.id || row.status !== "pending")
  ) {
    return { error: t("errors.notPermitted") };
  }

  const { error } = await svc
    .from("time_off_requests")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };

  await logAudit(svc, {
    company_id: ctx.company.id,
    action: "time_off.deleted",
    entity_type: "time_off_request",
    entity_id: id,
  });
  revalidatePath("/dashboard/availability");
  return { ok: true };
}
