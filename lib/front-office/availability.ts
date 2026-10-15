import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Availability engine for the AI phone assistant.
 *
 * The AI never reads a raw calendar and never does date math. It calls
 * check_availability with the caller's words ("Thursday", "tomorrow"); the
 * code below resolves the date, generates candidate slots from the
 * company's business hours, and subtracts existing AI bookings (expanded
 * by the buffer). book_appointment re-verifies the chosen slot at write
 * time, so two callers can never take the same slot.
 */

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
/** Per weekday: list of [open, close] "HH:MM" pairs. Empty = closed. */
export type BusinessHours = Record<Weekday, Array<[string, string]>>;

export type AvailabilitySettings = {
  bookingEnabled: boolean;
  slotMinutes: number;
  bufferMinutes: number;
  maxDaysAhead: number;
  businessHours: BusinessHours;
  timezone: string;
};

export type Slot = { start: Date; end: Date; label: string };

const WEEKDAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  mon: [["09:00", "17:00"]],
  tue: [["09:00", "17:00"]],
  wed: [["09:00", "17:00"]],
  thu: [["09:00", "17:00"]],
  fri: [["09:00", "17:00"]],
  sat: [],
  sun: [],
};

export const DEFAULT_AVAILABILITY: AvailabilitySettings = {
  bookingEnabled: false,
  slotMinutes: 60,
  bufferMinutes: 15,
  maxDaysAhead: 14,
  businessHours: DEFAULT_BUSINESS_HOURS,
  timezone: "America/New_York",
};

/** Sanitize whatever is stored in ai_business_hours into a valid shape. */
export function parseBusinessHours(raw: unknown): BusinessHours {
  const out: BusinessHours = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
  if (!raw || typeof raw !== "object") return { ...DEFAULT_BUSINESS_HOURS };
  const rec = raw as Record<string, unknown>;
  const validDay = (d: string): d is Weekday => (WEEKDAYS as string[]).includes(d);
  const validTime = (t: unknown): t is string =>
    typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
  let anyValid = false;
  for (const [day, val] of Object.entries(rec)) {
    if (!validDay(day) || !Array.isArray(val)) continue;
    const pairs: Array<[string, string]> = [];
    for (const p of val) {
      if (Array.isArray(p) && validTime(p[0]) && validTime(p[1]) && p[0] < p[1]) {
        pairs.push([p[0], p[1]]);
        anyValid = true;
      }
    }
    out[day] = pairs;
  }
  return anyValid ? out : { ...DEFAULT_BUSINESS_HOURS };
}

const clampInt = (v: unknown, lo: number, hi: number, fallback: number): number => {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(hi, Math.max(lo, n));
};

/**
 * Read availability settings for a company. If migration 0022 hasn't run
 * yet (columns missing), returns safe defaults with booking disabled so
 * existing call flows keep working.
 */
export async function getAvailabilitySettings(
  supabase: SupabaseClient,
  companyId: string,
): Promise<AvailabilitySettings> {
  try {
    const { data, error } = await supabase
      .from("front_office_settings")
      .select(
        "ai_booking_enabled, ai_slot_minutes, ai_buffer_minutes, ai_max_days_ahead, ai_business_hours, timezone",
      )
      .eq("company_id", companyId)
      .maybeSingle();
    if (error || !data) return { ...DEFAULT_AVAILABILITY };
    return {
      bookingEnabled: data.ai_booking_enabled === true,
      slotMinutes: clampInt(data.ai_slot_minutes, 15, 480, 60),
      bufferMinutes: clampInt(data.ai_buffer_minutes, 0, 180, 15),
      maxDaysAhead: clampInt(data.ai_max_days_ahead, 1, 60, 14),
      businessHours: parseBusinessHours(data.ai_business_hours),
      timezone: typeof data.timezone === "string" && data.timezone ? data.timezone : "America/New_York",
    };
  } catch {
    return { ...DEFAULT_AVAILABILITY };
  }
}

// ------------------------------------------------------------ timezone math

type TzParts = { y: number; mo: number; d: number; hh: number; mm: number; weekday: Weekday };

function tzParts(date: Date, tz: string): TzParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const map = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const wd = (map.weekday ?? "").toLowerCase().slice(0, 3);
  const wdMap: Record<string, Weekday> = {
    mon: "mon", tue: "tue", wed: "wed", thu: "thu", fri: "fri", sat: "sat", sun: "sun",
  };
  return {
    y: Number(map.year),
    mo: Number(map.month),
    d: Number(map.day),
    hh: Number(map.hour) % 24,
    mm: Number(map.minute),
    weekday: wdMap[wd] ?? "mon",
  };
}

/** Convert a wall-clock time in `tz` to a UTC Date. */
function wallToUtc(y: number, mo: number, d: number, hh: number, mm: number, tz: string): Date {
  const guess = Date.UTC(y, mo - 1, d, hh, mm);
  const asUtc = Date.UTC(
    ...(() => {
      const p = tzParts(new Date(guess), tz);
      return [p.y, p.mo - 1, p.d, p.hh, p.mm] as [number, number, number, number, number];
    })(),
  );
  return new Date(guess - (asUtc - guess));
}

function slotLabel(start: Date, tz: string): string {
  const s = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "short", month: "short", day: "numeric",
  }).format(start);
  const t = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "numeric", minute: "2-digit",
  }).format(start);
  return `${s} at ${t}`;
}

// ------------------------------------------------------------ slot search

type Busy = { start: number; end: number };

async function getBusyWindows(
  supabase: SupabaseClient,
  companyId: string,
  windowStart: Date,
  windowEnd: Date,
  bufferMin: number,
): Promise<Busy[]> {
  try {
    const { data, error } = await supabase
      .from("front_office_ai_bookings")
      .select("starts_at, ends_at")
      .eq("company_id", companyId)
      .eq("status", "booked")
      .lt("starts_at", windowEnd.toISOString())
      .gt("ends_at", windowStart.toISOString());
    if (error || !data) return [];
    const buf = bufferMin * 60_000;
    return data.map((b) => ({
      start: new Date(b.starts_at).getTime() - buf,
      end: new Date(b.ends_at).getTime() + buf,
    }));
  } catch {
    return [];
  }
}

/**
 * Find free slots. `from`/`to` optionally narrow to a caller-requested day
 * (resolved by resolveDateHint); otherwise searches the full horizon.
 */
export async function findAvailableSlots(
  supabase: SupabaseClient,
  companyId: string,
  opts: { from?: Date; to?: Date; durationMin?: number; limit?: number } = {},
): Promise<Slot[]> {
  const settings = await getAvailabilitySettings(supabase, companyId);
  if (!settings.bookingEnabled) return [];
  const { timezone: tz } = settings;
  const durationMin = opts.durationMin ?? settings.slotMinutes;
  const limit = opts.limit ?? 24;
  const leadMs = 2 * 60 * 60 * 1000; // nothing bookable within 2h
  const nowMs = Date.now();

  const horizonEnd = new Date(nowMs + settings.maxDaysAhead * 86_400_000);
  const from = opts.from && opts.from.getTime() > nowMs ? opts.from : new Date(nowMs);
  const to = opts.to && opts.to.getTime() < horizonEnd.getTime() ? opts.to : horizonEnd;

  const busy = await getBusyWindows(supabase, companyId, from, to, settings.bufferMinutes);
  const overlaps = (s: number, e: number) => busy.some((b) => s < b.end && e > b.start);

  const slots: Slot[] = [];
  const seenDays = new Set<string>();
  // Walk day by day in the company's timezone.
  for (let d = 0; d <= settings.maxDaysAhead + 1 && slots.length < limit; d++) {
    const probe = new Date(from.getTime() + d * 86_400_000);
    if (probe.getTime() > to.getTime()) break;
    const p = tzParts(probe, tz);
    const dayKey = `${p.y}-${p.mo}-${p.d}`;
    if (seenDays.has(dayKey)) continue;
    seenDays.add(dayKey);

    for (const [open, close] of settings.businessHours[p.weekday]) {
      const [oh, om] = open.split(":").map(Number);
      const [ch, cm] = close.split(":").map(Number);
      const openMin = oh * 60 + om;
      const closeMin = ch * 60 + cm;
      for (let t = openMin; t + durationMin <= closeMin && slots.length < limit; t += 30) {
        const start = wallToUtc(p.y, p.mo, p.d, Math.floor(t / 60), t % 60, tz);
        if (start.getTime() > to.getTime()) break;
        if (start.getTime() < nowMs + leadMs) continue;
        const end = new Date(start.getTime() + durationMin * 60_000);
        if (end.getTime() > to.getTime() + 60_000) continue;
        if (overlaps(start.getTime(), end.getTime())) continue;
        slots.push({ start, end, label: slotLabel(start, tz) });
      }
    }
  }
  return slots;
}

/** True when [start, end) has no buffered booking overlapping it. */
export async function isSlotFree(
  supabase: SupabaseClient,
  companyId: string,
  start: Date,
  end: Date,
): Promise<boolean> {
  const settings = await getAvailabilitySettings(supabase, companyId);
  if (!settings.bookingEnabled) return false;
  const busy = await getBusyWindows(
    supabase,
    companyId,
    new Date(start.getTime() - 3_600_000),
    new Date(end.getTime() + 3_600_000),
    settings.bufferMinutes,
  );
  return !busy.some((b) => start.getTime() < b.end && end.getTime() > b.start);
}

// ------------------------------------------------------------ date hints

const WEEKDAY_NAMES: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6,
};

function ymdInTz(date: Date, tz: string): { y: number; mo: number; d: number } {
  const p = tzParts(date, tz);
  return { y: p.y, mo: p.mo, d: p.d };
}

function dayRange(y: number, mo: number, d: number, tz: string): { start: Date; end: Date } {
  return { start: wallToUtc(y, mo, d, 0, 0, tz), end: wallToUtc(y, mo, d, 23, 59, tz) };
}

/**
 * Turn the caller's words into a UTC day range in the company timezone.
 * Returns null when the hint can't be understood (caller gets the general
 * upcoming availability instead).
 */
export function resolveDateHint(
  hint: string,
  tz: string,
  now: Date = new Date(),
): { start: Date; end: Date } | null {
  const h = hint.trim().toLowerCase().replace(/[.,!?]+$/, "");
  if (!h) return null;
  const base = ymdInTz(now, tz);
  const baseMs = Date.UTC(base.y, base.mo - 1, base.d);

  if (h === "today") return dayRange(base.y, base.mo, base.d, tz);
  if (h === "tomorrow") {
    const t = new Date(baseMs + 86_400_000);
    return dayRange(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), tz);
  }
  if (h === "day after tomorrow") {
    const t = new Date(baseMs + 2 * 86_400_000);
    return dayRange(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), tz);
  }
  if (h === "this weekend" || h === "weekend") {
    // Upcoming Saturday..Sunday.
    const dow = new Date(baseMs).getUTCDay();
    const satOffset = (6 - dow + 7) % 7;
    const sat = new Date(baseMs + satOffset * 86_400_000);
    const sun = new Date(sat.getTime() + 86_400_000);
    return {
      start: wallToUtc(sat.getUTCFullYear(), sat.getUTCMonth() + 1, sat.getUTCDate(), 0, 0, tz),
      end: wallToUtc(sun.getUTCFullYear(), sun.getUTCMonth() + 1, sun.getUTCDate(), 23, 59, tz),
    };
  }

  const iso = h.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return dayRange(Number(iso[1]), Number(iso[2]), Number(iso[3]), tz);
  }

  const nextMatch = h.match(/^next\s+([a-z]+)$/);
  const thisMatch = h.match(/^(?:this\s+)?([a-z]+)$/);
  const wdName = nextMatch?.[1] ?? thisMatch?.[1];
  if (wdName && wdName in WEEKDAY_NAMES) {
    const target = WEEKDAY_NAMES[wdName];
    const dow = new Date(baseMs).getUTCDay();
    let offset = (target - dow + 7) % 7;
    if (nextMatch) offset = offset === 0 ? 7 : offset + 7; // "next Monday" = week after
    const t = new Date(baseMs + offset * 86_400_000);
    return dayRange(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), tz);
  }
  return null;
}
