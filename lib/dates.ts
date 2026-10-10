/**
 * Compute the UTC bounds of "today" in a given IANA timezone.
 * Used to query timestamptz columns for the company's local day.
 */
export function dayBoundsUtc(
  timezone: string,
  date = new Date(),
): { start: Date; end: Date } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const y = Number(get("year"));
  const m = Number(get("month"));
  const d = Number(get("day"));

  const start = zonedTimeToUtc(y, m, d, 0, 0, timezone);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function tzOffsetMinutes(timezone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUtc - date.getTime()) / 60000;
}

/**
 * Convert a `datetime-local` input value ("2026-10-09T09:30") interpreted in
 * the given timezone to a UTC Date.
 */
export function localInputToUtc(value: string, timezone: string): Date {
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = (timePart ?? "00:00").split(":").map(Number);
  return zonedTimeToUtc(y, m, d, hh || 0, mm || 0, timezone);
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string,
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return new Date(guess.getTime() - tzOffsetMinutes(timezone, guess) * 60000);
}

/**
 * UTC instant of midnight (start of day) for a zoned calendar date.
 * Month/day may overflow (e.g. day 0 → last day of previous month) —
 * Date.UTC normalizes them the same way the calendar does.
 */
export function zonedDayStartUtc(
  timezone: string,
  year: number,
  month: number,
  day: number,
): Date {
  return zonedTimeToUtc(year, month, day, 0, 0, timezone);
}
