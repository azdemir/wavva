import { zonedDayStartUtc } from "./dates";

/**
 * Date-range filter shared by the quotes and invoices list pages.
 * Bounds are computed in the company's timezone so "today" / "this week" /
 * "this month" match the business's local day. Week starts on Sunday
 * (US convention).
 */
export const PERIODS = ["all", "today", "week", "month"] as const;
export type Period = (typeof PERIODS)[number];

export function parsePeriod(value: string | undefined | null): Period {
  return (PERIODS as readonly string[]).includes(value ?? "") ? (value as Period) : "all";
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * UTC ISO instant at the start of the selected period in the given timezone.
 * Returns null for "all" (no lower bound).
 */
export function periodStartUtc(
  timezone: string,
  period: Period,
  now = new Date(),
): string | null {
  if (period === "all") return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const year = Number(get("year"));
  const month = Number(get("month"));
  let day = Number(get("day"));

  if (period === "month") {
    day = 1;
  } else if (period === "week") {
    const weekday = WEEKDAYS.indexOf(get("weekday"));
    day = day - (weekday === -1 ? 0 : weekday);
  }

  return zonedDayStartUtc(timezone, year, month, day).toISOString();
}
