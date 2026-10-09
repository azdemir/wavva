/**
 * Shared (client + server) import validation helpers.
 *
 * Validation functions return error *codes* that map to the
 * `validation.<code>` keys in the import.json message files, so the client
 * and server actions agree on the messages shown.
 */

import { localInputToUtc } from "@/lib/dates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** A mapped import row: TidyPro field name -> raw string value. */
export type MappedRow = Record<string, string>;

export const RECURRENCE_VALUES = ["none", "weekly", "biweekly", "monthly"] as const;

/** Digits-only version of a phone string. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Cap a string at a safe length for DB writes. */
export function cap(value: string, max = 500): string {
  return value.length > max ? value.slice(0, max) : value;
}

/**
 * Resolve the customer name for a row. Client combines first+last before
 * sending, but the server also tolerates split fields just in case.
 */
export function rowName(row: MappedRow): string {
  const name = (row.name ?? "").trim();
  if (name) return name;
  const first = (row.first_name ?? "").trim();
  const last = (row.last_name ?? "").trim();
  return [first, last].filter(Boolean).join(" ");
}

export function rowCustomerType(row: MappedRow): "residential" | "commercial" {
  return (row.customer_type ?? "").trim().toLowerCase() === "commercial"
    ? "commercial"
    : "residential";
}

/** Normalize recurrence; returns null when invalid. */
export function normalizeRecurrence(row: MappedRow): string | null {
  const raw = (row.appt_recurrence ?? "").trim().toLowerCase();
  if (!raw) return "none";
  if ((RECURRENCE_VALUES as readonly string[]).includes(raw)) return raw;
  // Friendly synonyms.
  if (["every week", "weekly1", "1 week"].includes(raw)) return "weekly";
  if (["every 2 weeks", "fortnightly", "every two weeks"].includes(raw))
    return "biweekly";
  if (["every month"].includes(raw)) return "monthly";
  return null;
}

function toLocalDateTime(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  timezone: string,
): Date | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  const dt = localInputToUtc(
    `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`,
    timezone,
  );
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Parse an appointment date/time string into a UTC Date.
 * Accepts: full ISO 8601 (with timezone), "YYYY-MM-DD HH:mm[[:ss]]",
 * "YYYY-MM-DD", "MM/DD/YYYY h:mm AM", "MM/DD/YYYY".
 * Local formats are interpreted in the given IANA timezone.
 */
export function parseApptDate(value: string, timezone: string): Date | null {
  const s = value.trim();
  if (!s) return null;

  // Full ISO 8601 with explicit timezone/offset or Z.
  if (/[zZ]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // "YYYY-MM-DD HH:mm[:ss]" or "YYYY-MM-DDTHH:mm[:ss]" (no offset) -> local.
  let m = s.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (m) {
    return toLocalDateTime(+m[1], +m[2], +m[3], +m[4], +m[5], timezone);
  }

  // "YYYY-MM-DD" -> 9:00 AM local.
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    return toLocalDateTime(+m[1], +m[2], +m[3], 9, 0, timezone);
  }

  // "MM/DD/YYYY h:mm[:ss] AM/PM" -> local.
  m = s.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([aApP])\.?[mM]\.?$/,
  );
  if (m) {
    let h = +m[4] % 12;
    if (m[7].toLowerCase() === "p") h += 12;
    let y = +m[3];
    if (y < 100) y += 2000;
    return toLocalDateTime(y, +m[1], +m[2], h, +m[5], timezone);
  }

  // "MM/DD/YYYY" -> 9:00 AM local.
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let y = +m[3];
    if (y < 100) y += 2000;
    return toLocalDateTime(y, +m[1], +m[2], 9, 0, timezone);
  }

  return null;
}

/**
 * Combine an appointment date and start-time into one value for parsing.
 * If appt_start is already a full date/time it is used as-is; otherwise a
 * bare time in appt_start is combined with appt_date.
 */
export function combineApptStart(row: MappedRow): string {
  const start = (row.appt_start ?? "").trim();
  const date = (row.appt_date ?? "").trim();
  if (start) return start;
  return date;
}

export type RowError = { code: string };

/**
 * Validate one mapped row for the preview step.
 * Returns an empty array when the row is importable.
 */
export function validateMappedRow(row: MappedRow, timezone: string): string[] {
  const codes: string[] = [];
  const name = rowName(row);
  if (!name) codes.push("nameRequired");

  const email = (row.email ?? "").trim();
  if (email && !EMAIL_RE.test(email)) codes.push("emailInvalid");

  const phone = (row.phone ?? "").trim();
  if (phone && digitsOnly(phone).length < 7) codes.push("phoneInvalid");

  const hasApptFields =
    (row.appt_start ?? "").trim() !== "" ||
    (row.appt_date ?? "").trim() !== "";
  if (hasApptFields) {
    const start = parseApptDate(combineApptStart(row), timezone);
    if (!start) {
      codes.push("dateInvalid");
    } else {
      const endRaw = (row.appt_end ?? "").trim();
      if (endRaw) {
        const end = parseApptDate(endRaw, timezone);
        if (!end) {
          codes.push("endInvalid");
        } else if (end.getTime() <= start.getTime()) {
          codes.push("endBeforeStart");
        }
      }
    }
    if (normalizeRecurrence(row) === null) codes.push("recurrenceInvalid");
  }
  return codes;
}
