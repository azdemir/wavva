"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireCompany } from "@/lib/auth";
import { isStaff, NOT_PERMITTED } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { nextNumber } from "@/lib/pricing";
import { missingColumnName } from "@/lib/supabase/schema-fallback";
import {
  cap,
  combineApptStart,
  digitsOnly,
  normalizeRecurrence,
  parseApptDate,
  rowCustomerType,
  rowName,
  validateMappedRow,
  type MappedRow,
} from "@/lib/import/validate";

const MAX_IMPORT_ROWS = 2000;
const MAX_STR_LEN = 500;

export type DedupeChoice = "skip" | "import";
export type DedupeChoices = Record<string, DedupeChoice>;

export type DuplicateMatch = {
  index: number;
  status: "new" | "duplicate";
  /** Name of the already-existing customer that matched, if any. */
  matchedName?: string;
  /** Which comparison matched: email | phone | name_address. */
  matchOn?: "email" | "phone" | "name_address";
};

export type DuplicatesResult = {
  error?: string;
  matches?: DuplicateMatch[];
};

export type ImportError = { row: number; message: string };

export type CommitResult = {
  error?: string;
  created_customers?: number;
  created_bookings?: number;
  errors?: ImportError[];
};

type ExistingCustomer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  defaultAddressLine1: string | null;
};

/** Shape-check the incoming rows without trusting the client. */
function sanitizeRows(input: unknown): MappedRow[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_IMPORT_ROWS) {
    return null;
  }
  const out: MappedRow[] = [];
  for (const raw of input) {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
    const row: MappedRow = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === "string") row[k] = cap(v.trim(), MAX_STR_LEN);
      else if (typeof v === "number" || typeof v === "boolean") {
        row[k] = cap(String(v), MAX_STR_LEN);
      }
    }
    out.push(row);
  }
  return out;
}

/** Load existing customers (+ their default address line1) for matching. */
async function loadExistingCustomers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
): Promise<ExistingCustomer[]> {
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, email, phone")
    .eq("company_id", companyId)
    .limit(10000);
  const rows = (customers ?? []) as {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  }[];
  const byId = new Map<string, ExistingCustomer>(
    rows.map((c) => [
      c.id,
      {
        id: c.id,
        name: c.name ?? "",
        email: c.email,
        phone: c.phone,
        defaultAddressLine1: null,
      },
    ]),
  );
  if (byId.size === 0) return [];
  const { data: addresses } = await supabase
    .from("service_addresses")
    .select("customer_id, address_line1")
    .eq("company_id", companyId)
    .eq("is_default", true)
    .in(
      "customer_id",
      [...byId.keys()].slice(0, 1000),
    );
  for (const a of (addresses ?? []) as {
    customer_id: string;
    address_line1: string;
  }[]) {
    const c = byId.get(a.customer_id);
    if (c && !c.defaultAddressLine1) c.defaultAddressLine1 = a.address_line1;
  }
  return [...byId.values()];
}

/** Match one import row against existing customers (no merging, ever). */
function matchRow(row: MappedRow, existing: ExistingCustomer[]): DuplicateMatch {
  const email = (row.email ?? "").trim().toLowerCase();
  if (email) {
    const hit = existing.find(
      (c) => (c.email ?? "").trim().toLowerCase() === email,
    );
    if (hit) {
      return { index: 0, status: "duplicate", matchedName: hit.name, matchOn: "email" };
    }
  }
  const digits = digitsOnly(row.phone ?? "");
  if (digits.length >= 7) {
    const hit = existing.find((c) => digitsOnly(c.phone ?? "") === digits);
    if (hit) {
      return { index: 0, status: "duplicate", matchedName: hit.name, matchOn: "phone" };
    }
  }
  const name = rowName(row).toLowerCase();
  const line1 = (row.address_line1 ?? "").trim().toLowerCase();
  if (name && line1) {
    const hit = existing.find(
      (c) =>
        c.name.trim().toLowerCase() === name &&
        (c.defaultAddressLine1 ?? "").trim().toLowerCase() === line1,
    );
    if (hit) {
      return {
        index: 0,
        status: "duplicate",
        matchedName: hit.name,
        matchOn: "name_address",
      };
    }
  }
  return { index: 0, status: "new" };
}

/**
 * Find emails that appear in more than one row of the same file.
 * Returns a map of row index -> first row index that used the email.
 */
function findWithinFileDuplicateEmails(rows: MappedRow[]): Map<number, number> {
  const seen = new Map<string, number>();
  const dupes = new Map<number, number>();
  rows.forEach((row, i) => {
    const email = (row.email ?? "").trim().toLowerCase();
    if (!email) return;
    const first = seen.get(email);
    if (first === undefined) seen.set(email, i);
    else dupes.set(i, first);
  });
  return dupes;
}

/**
 * Compare import rows against existing customers AND against each other.
 * Returns one match entry per row: "new" or "duplicate". A row that matches
 * an existing customer keeps that (more informative) match; a row that only
 * duplicates another row in the same file is flagged against that row.
 */
export async function findImportDuplicates(
  rowsInput: unknown,
): Promise<DuplicatesResult> {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const t = await getTranslations("import");

  const rows = sanitizeRows(rowsInput);
  if (!rows) return { error: t("actions.tooManyRows") };

  const supabase = await createClient();
  try {
    const existing = await loadExistingCustomers(supabase, ctx.company.id);
    const withinFile = findWithinFileDuplicateEmails(rows);
    return {
      matches: rows.map((row, index) => {
        const m = { ...matchRow(row, existing), index };
        const firstIdx = withinFile.get(index);
        if (firstIdx !== undefined && m.status !== "duplicate") {
          return {
            index,
            status: "duplicate" as const,
            matchedName: `Row ${firstIdx + 1} in this file`,
            matchOn: "email" as const,
          };
        }
        return m;
      }),
    };
  } catch {
    return { error: t("actions.duplicateCheckFailed") };
  }
}

async function insertCustomer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    company_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
    customer_type: string;
  },
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("customers")
    .insert(input)
    .select("id")
    .single();
  if (!error) return data as { id: string };
  // The DB may be behind on migration 0008 (no customer_type column yet).
  if (missingColumnName(error) === "customer_type") {
    const { company_id, name, email, phone, notes } = input;
    const retry = await supabase
      .from("customers")
      .insert({ company_id, name, email, phone, notes })
      .select("id")
      .single();
    if (!retry.error) return retry.data as { id: string };
  }
  return null;
}

/**
 * Commit an import: create customers and their appointments.
 * One bad row never aborts the batch — per-row errors are collected.
 */
export async function commitImport(input: unknown): Promise<CommitResult> {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const t = await getTranslations("import");

  const parsed = (input ?? {}) as {
    rows?: unknown;
    dedupeChoices?: unknown;
  };
  const rows = sanitizeRows(parsed.rows);
  if (!rows) return { error: t("actions.tooManyRows") };
  const dedupeChoices: DedupeChoices =
    typeof parsed.dedupeChoices === "object" && parsed.dedupeChoices !== null
      ? (parsed.dedupeChoices as DedupeChoices)
      : {};

  const supabase = await createClient();
  const companyId = ctx.company.id;
  const timezone = ctx.company.timezone || "America/New_York";
  const errors: ImportError[] = [];
  let createdCustomers = 0;
  let createdBookings = 0;

  // Re-run duplicate detection so "skip" choices can't be abused client-side.
  let existing: ExistingCustomer[] = [];
  try {
    existing = await loadExistingCustomers(supabase, companyId);
  } catch {
    return { error: t("actions.duplicateCheckFailed") };
  }
  // Within-file duplicates are rejected here too, so a tampered client
  // can't smuggle them past the duplicates step.
  const withinFileDupes = findWithinFileDuplicateEmails(rows);

  // Booking numbers: take MAX(existing) once, then increment per insert —
  // never reuse deleted numbers, so the unique constraint can't collide.
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("booking_number")
    .eq("company_id", companyId)
    .like("booking_number", "B-%");
  let bookingSeq = 0;
  for (const b of existingBookings ?? []) {
    const m = b.booking_number?.match(/-(\d+)$/);
    if (m) bookingSeq = Math.max(bookingSeq, parseInt(m[1], 10));
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNo = i + 1;
    try {
      // Server-side validation mirrors the client preview.
      const codes = validateMappedRow(row, timezone);
      if (codes.length > 0) {
        errors.push({
          row: rowNo,
          message: codes.map((c) => t(`validation.${c}`)).join(" "),
        });
        continue;
      }

      // A row duplicating another row in the same file is always rejected —
      // importing it would create two customers sharing one email.
      const firstIdx = withinFileDupes.get(i);
      if (firstIdx !== undefined) {
        errors.push({
          row: rowNo,
          message: `Duplicate email in this file (row ${firstIdx + 1}).`,
        });
        continue;
      }

      const match = matchRow(row, existing);
      const choice: DedupeChoice =
        dedupeChoices[String(i)] === "skip" ? "skip" : "import";
      if (choice === "skip" && match.status === "duplicate") continue;

      // --- Customer ---
      const customer = await insertCustomer(supabase, {
        company_id: companyId,
        name: rowName(row),
        email: (row.email ?? "").trim() || null,
        phone: (row.phone ?? "").trim() || null,
        notes: (row.notes ?? "").trim() || null,
        customer_type: rowCustomerType(row),
      });
      if (!customer) {
        errors.push({ row: rowNo, message: t("actions.customerCreateFailed") });
        continue;
      }
      createdCustomers++;

      // --- Address ---
      let addressId: string | null = null;
      const hasFullAddress =
        (row.address_line1 ?? "").trim() &&
        (row.city ?? "").trim() &&
        (row.state ?? "").trim() &&
        (row.zip ?? "").trim();
      if (hasFullAddress) {
        const { data: addr, error: addrError } = await supabase
          .from("service_addresses")
          .insert({
            company_id: companyId,
            customer_id: customer.id,
            label: "Home",
            address_line1: row.address_line1.trim(),
            address_line2: (row.address_line2 ?? "").trim() || null,
            city: row.city.trim(),
            state: row.state.trim(),
            zip: row.zip.trim(),
            is_default: true,
          })
          .select("id")
          .single();
        if (addrError) {
          errors.push({ row: rowNo, message: t("actions.addressCreateFailed") });
        } else {
          addressId = (addr as { id: string }).id;
        }
      }

      // --- Appointment (only with a parsed start AND a resolved address) ---
      const startRaw = combineApptStart(row);
      const start = startRaw ? parseApptDate(startRaw, timezone) : null;
      if (!startRaw) {
        // No appointment data at all — customer-only import is fine.
      } else if (!start) {
        // Already covered by validation above; unreachable in practice.
      } else if (!addressId) {
        errors.push({ row: rowNo, message: t("actions.noAddressForBooking") });
      } else {
        let end: Date | null = null;
        const endRaw = (row.appt_end ?? "").trim();
        if (endRaw) end = parseApptDate(endRaw, timezone);
        if (!end) end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

        const notesParts: string[] = [];
        const service = (row.appt_service ?? "").trim();
        if (service) notesParts.push(`Service: ${service}`);
        const apptNotes = (row.appt_notes ?? "").trim();
        if (apptNotes) notesParts.push(apptNotes);

        const { error: bookingError } = await supabase.from("bookings").insert({
          company_id: companyId,
          customer_id: customer.id,
          service_address_id: addressId,
          booking_number: nextNumber("B", bookingSeq),
          status: "scheduled",
          scheduled_start: start.toISOString(),
          scheduled_end: end.toISOString(),
          recurrence: normalizeRecurrence(row) ?? "none",
          notes: notesParts.join("\n") || null,
        });
        if (bookingError) {
          errors.push({ row: rowNo, message: t("actions.bookingCreateFailed") });
        } else {
          bookingSeq++;
          createdBookings++;
        }
      }
    } catch {
      errors.push({ row: rowNo, message: t("actions.invalidInput") });
    }
  }

  await logAudit(supabase, {
    company_id: companyId,
    action: "import.committed",
    entity_type: "import",
    metadata: {
      created_customers: createdCustomers,
      created_bookings: createdBookings,
      row_errors: errors.length,
    },
  });

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/schedule");

  return {
    created_customers: createdCustomers,
    created_bookings: createdBookings,
    errors,
  };
}
