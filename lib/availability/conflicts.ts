import { createServiceClient } from "@/lib/supabase/server";

export type AvailabilityWindow = { weekday: number; start: string; end: string };
export type TimeOffOverlap = {
  id: string;
  status: "pending" | "approved" | "denied";
  starts_on: string;
  ends_on: string;
  reason: string;
};

export type DayStatus = {
  /** Weekly-recurring windows for the weekday of dateISO. */
  windows: AvailabilityWindow[];
  /** Any PTO request whose date range covers dateISO (any status). */
  timeOff: TimeOffOverlap[];
};

/**
 * Read-only day status for UI conflict warnings: weekly availability
 * windows for the member's weekday plus any overlapping PTO requests.
 * dateISO is a calendar date "YYYY-MM-DD"; weekday follows JS getDay()
 * (0 = Sunday). Returns null when migration 0017 has not been run yet.
 */
export async function getDayStatus(
  companyId: string,
  membershipId: string,
  dateISO: string,
): Promise<DayStatus | null> {
  const svc = await createServiceClient();
  const weekday = new Date(`${dateISO}T12:00:00Z`).getUTCDay();

  const [{ data: rows, error: wErr }, { data: off, error: oErr }] = await Promise.all([
    svc
      .from("cleaner_availability")
      .select("weekday, start_time, end_time")
      .eq("company_id", companyId)
      .eq("membership_id", membershipId)
      .eq("weekday", weekday)
      .order("start_time"),
    svc
      .from("time_off_requests")
      .select("id, status, starts_on, ends_on, reason")
      .eq("company_id", companyId)
      .eq("membership_id", membershipId)
      .lte("starts_on", dateISO)
      .gte("ends_on", dateISO),
  ]);

  // 42P01 = undefined_table / PGRST205 = table missing from PostgREST
  // schema cache: migration 0017 not run yet. Let callers render nothing.
  if (wErr && (wErr.code === "42P01" || wErr.code === "PGRST205")) return null;
  if (oErr && (oErr.code === "42P01" || oErr.code === "PGRST205")) return null;

  return {
    windows: (rows ?? []).map((r) => ({
      weekday: r.weekday,
      start: (r.start_time as string).slice(0, 5),
      end: (r.end_time as string).slice(0, 5),
    })),
    timeOff: (off ?? []).map((r) => ({
      id: r.id,
      status: r.status as TimeOffOverlap["status"],
      starts_on: r.starts_on,
      ends_on: r.ends_on,
      reason: r.reason ?? "",
    })),
  };
}

/** True when a HH:MM–HH:MM job fits entirely inside one availability window. */
export function fitsInsideWindows(
  windows: AvailabilityWindow[],
  jobStart: string,
  jobEnd: string,
): boolean {
  return windows.some((w) => w.start <= jobStart && jobEnd <= w.end);
}
