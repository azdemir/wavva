import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getActiveMembership } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { rateLimit } from "@/lib/rate-limit";
import { missingColumnName } from "@/lib/supabase/schema-fallback";
import { parsePeriod, periodStartUtc } from "@/lib/periods";

const MAX_ROWS = 5000;
const TYPES = ["customers", "invoices", "bookings", "conversations", "jobs", "quotes", "full"] as const;
type ExportType = (typeof TYPES)[number];

/** Types that produce a single-sheet export. */
type SingleType = "customers" | "invoices" | "bookings" | "conversations";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1D4ED8" },
};

function sanitizeLike(q: string): string {
  return `%${q.replace(/[%_]/g, "")}%`;
}

/** Resolve a customer-name search to matching customer ids (cross-table ilike). */
async function matchingCustomerIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  q: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("customers")
    .select("id")
    .eq("company_id", companyId)
    .ilike("name", sanitizeLike(q));
  return (data ?? []).map((m) => m.id as string);
}

type Column = {
  header: string;
  width: number;
  value: (row: Record<string, unknown>) => string | number | Date | null;
  numFmt?: string;
};

const money = (cents: unknown): number | null =>
  typeof cents === "number" ? cents / 100 : null;
const yesNo = (v: unknown): string => (v ? "Yes" : "No");
const dateOnly = (iso: unknown): Date | null =>
  typeof iso === "string" && iso ? new Date(iso) : null;

type Ctx = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  companyId: string;
  timezone: string;
  q: string;
  like: string;
  status: string;
  custType: string;
  periodStart: string | null;
};

async function fetchRows(t: SingleType | "jobs" | "quotes", ctx: Ctx): Promise<Record<string, unknown>[]> {
  const { supabase, companyId, q, like, status, custType, periodStart } = ctx;
  if (t === "customers") {
    const buildQuery = (withType: boolean) => {
      let query = supabase
        .from("customers")
        .select(
          withType
            ? "name, customer_type, email, phone, sms_consent, notes, created_at"
            : "name, email, phone, sms_consent, notes, created_at"
        )
        .eq("company_id", companyId)
        .order("name", { ascending: true })
        .limit(MAX_ROWS);
      if (withType && (custType === "residential" || custType === "commercial")) {
        query = query.eq("customer_type", custType);
      }
      if (q) query = query.or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like}`);
      return query;
    };
    const first = await buildQuery(true);
    let rowsRaw = first.data;
    if (first.error && missingColumnName(first.error) === "customer_type") {
      // DB behind on migration 0008 — export without the type column.
      ({ data: rowsRaw } = await buildQuery(false));
    }
    return (rowsRaw ?? []) as unknown as Record<string, unknown>[];
  }
  if (t === "invoices") {
    let query = supabase
      .from("invoices")
      .select(
        "invoice_number, status, subtotal_cents, tax_cents, total_cents, amount_paid_cents, due_date, created_at, customers(name)",
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS);
    if (status !== "all") query = query.eq("status", status);
    if (periodStart) query = query.gte("created_at", periodStart);
    if (q) {
      const ids = await matchingCustomerIds(supabase, companyId, q);
      query =
        ids.length > 0
          ? query.or(`invoice_number.ilike.${like},customer_id.in.(${ids.join(",")})`)
          : query.ilike("invoice_number", like);
    }
    const { data } = await query;
    return (data ?? []) as unknown as Record<string, unknown>[];
  }
  if (t === "bookings") {
    let query = supabase
      .from("bookings")
      .select(
        "booking_number, status, recurrence, scheduled_start, scheduled_end, notes, customers(name), service_addresses(address_line1, city, state, zip)",
      )
      .eq("company_id", companyId)
      .order("scheduled_start", { ascending: false })
      .limit(MAX_ROWS);
    if (status !== "all") query = query.eq("status", status);
    if (q) {
      const ids = await matchingCustomerIds(supabase, companyId, q);
      query =
        ids.length > 0
          ? query.or(`booking_number.ilike.${like},customer_id.in.(${ids.join(",")})`)
          : query.ilike("booking_number", like);
    }
    const { data } = await query;
    return (data ?? []) as unknown as Record<string, unknown>[];
  }
  if (t === "jobs") {
    let query = supabase
      .from("jobs")
      .select("status, scheduled_start, scheduled_end, notes, created_at, customers(name)")
      .eq("company_id", companyId)
      .order("scheduled_start", { ascending: false })
      .limit(MAX_ROWS);
    if (status !== "all") query = query.eq("status", status);
    if (q) {
      const ids = await matchingCustomerIds(supabase, companyId, q);
      query = ids.length > 0 ? query.in("customer_id", ids) : query.eq("customer_id", "00000000-0000-0000-0000-000000000000");
    }
    const { data } = await query;
    return (data ?? []) as unknown as Record<string, unknown>[];
  }
  if (t === "quotes") {
    let query = supabase
      .from("quotes")
      .select("quote_number, status, subtotal_cents, tax_cents, total_cents, valid_until, created_at, customers(name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS);
    if (status !== "all") query = query.eq("status", status);
    if (q) {
      const ids = await matchingCustomerIds(supabase, companyId, q);
      query =
        ids.length > 0
          ? query.or(`quote_number.ilike.${like},customer_id.in.(${ids.join(",")})`)
          : query.ilike("quote_number", like);
    }
    const { data } = await query;
    return (data ?? []) as unknown as Record<string, unknown>[];
  }
  // conversations
  let query = supabase
    .from("front_office_conversations")
    .select("channel, direction, body, created_at, customers(name)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);
  if (q) {
    const ids = await matchingCustomerIds(supabase, companyId, q);
    query = ids.length > 0 ? query.in("customer_id", ids) : query.eq("customer_id", "00000000-0000-0000-0000-000000000000");
  }
  const { data } = await query;
  return (data ?? []) as unknown as Record<string, unknown>[];
}

const COLUMNS: Record<SingleType | "jobs" | "quotes", { title: string; columns: Column[] }> = {
  customers: {
    title: "Customers",
    columns: [
      { header: "Name", width: 24, value: (r) => (r.name as string) ?? "" },
      {
        header: "Type",
        width: 13,
        value: (r) => ((r.customer_type as string) === "commercial" ? "Commercial" : "Residential"),
      },
      { header: "Email", width: 30, value: (r) => (r.email as string) ?? "" },
      { header: "Phone", width: 18, value: (r) => (r.phone as string) ?? "" },
      { header: "SMS consent", width: 13, value: (r) => yesNo(r.sms_consent) },
      { header: "Notes", width: 40, value: (r) => (r.notes as string) ?? "" },
      { header: "Customer since", width: 16, value: (r) => dateOnly(r.created_at), numFmt: "yyyy-mm-dd" },
    ],
  },
  invoices: {
    title: "Invoices",
    columns: [
      { header: "Invoice #", width: 14, value: (r) => (r.invoice_number as string) ?? "" },
      { header: "Customer", width: 24, value: (r) => one(r.customers as { name: string } | null)?.name ?? "" },
      { header: "Status", width: 12, value: (r) => (r.status as string) ?? "" },
      { header: "Issue date", width: 14, value: (r) => dateOnly(r.created_at), numFmt: "yyyy-mm-dd" },
      { header: "Due date", width: 14, value: (r) => dateOnly(r.due_date), numFmt: "yyyy-mm-dd" },
      { header: "Subtotal", width: 12, value: (r) => money(r.subtotal_cents), numFmt: '"$"#,##0.00' },
      { header: "Tax", width: 12, value: (r) => money(r.tax_cents), numFmt: '"$"#,##0.00' },
      { header: "Total", width: 12, value: (r) => money(r.total_cents), numFmt: '"$"#,##0.00' },
      { header: "Paid", width: 12, value: (r) => money(r.amount_paid_cents), numFmt: '"$"#,##0.00' },
      {
        header: "Balance",
        width: 12,
        value: (r) =>
          typeof r.total_cents === "number" && typeof r.amount_paid_cents === "number"
            ? (r.total_cents - r.amount_paid_cents) / 100
            : null,
        numFmt: '"$"#,##0.00',
      },
    ],
  },
  bookings: {
    title: "Bookings",
    columns: [
      { header: "Booking #", width: 14, value: (r) => (r.booking_number as string) ?? "" },
      { header: "Customer", width: 24, value: (r) => one(r.customers as { name: string } | null)?.name ?? "" },
      { header: "Status", width: 14, value: (r) => (r.status as string) ?? "" },
      { header: "Start", width: 18, value: (r) => dateOnly(r.scheduled_start), numFmt: "yyyy-mm-dd hh:mm" },
      { header: "End", width: 18, value: (r) => dateOnly(r.scheduled_end), numFmt: "yyyy-mm-dd hh:mm" },
      {
        header: "Address",
        width: 34,
        value: (r) => {
          const a = one(r.service_addresses as { address_line1: string; city: string; state: string; zip: string } | null);
          return a ? `${a.address_line1}, ${a.city}, ${a.state} ${a.zip}` : "";
        },
      },
      { header: "Recurrence", width: 12, value: (r) => (r.recurrence as string) ?? "" },
      { header: "Notes", width: 40, value: (r) => (r.notes as string) ?? "" },
    ],
  },
  conversations: {
    title: "Conversations",
    columns: [
      { header: "Date", width: 18, value: (r) => dateOnly(r.created_at), numFmt: "yyyy-mm-dd hh:mm" },
      { header: "Customer", width: 24, value: (r) => one(r.customers as { name: string } | null)?.name ?? "" },
      { header: "Channel", width: 10, value: (r) => (r.channel as string) ?? "" },
      { header: "Direction", width: 10, value: (r) => (r.direction as string) ?? "" },
      { header: "Message", width: 80, value: (r) => (r.body as string) ?? "" },
    ],
  },
  jobs: {
    title: "Jobs",
    columns: [
      { header: "Customer", width: 24, value: (r) => one(r.customers as { name: string } | null)?.name ?? "" },
      { header: "Status", width: 14, value: (r) => (r.status as string) ?? "" },
      { header: "Start", width: 18, value: (r) => dateOnly(r.scheduled_start), numFmt: "yyyy-mm-dd hh:mm" },
      { header: "End", width: 18, value: (r) => dateOnly(r.scheduled_end), numFmt: "yyyy-mm-dd hh:mm" },
      { header: "Notes", width: 40, value: (r) => (r.notes as string) ?? "" },
      { header: "Created", width: 16, value: (r) => dateOnly(r.created_at), numFmt: "yyyy-mm-dd" },
    ],
  },
  quotes: {
    title: "Quotes",
    columns: [
      { header: "Quote #", width: 14, value: (r) => (r.quote_number as string) ?? "" },
      { header: "Customer", width: 24, value: (r) => one(r.customers as { name: string } | null)?.name ?? "" },
      { header: "Status", width: 12, value: (r) => (r.status as string) ?? "" },
      { header: "Subtotal", width: 12, value: (r) => money(r.subtotal_cents), numFmt: '"$"#,##0.00' },
      { header: "Tax", width: 12, value: (r) => money(r.tax_cents), numFmt: '"$"#,##0.00' },
      { header: "Total", width: 12, value: (r) => money(r.total_cents), numFmt: '"$"#,##0.00' },
      { header: "Valid until", width: 14, value: (r) => dateOnly(r.valid_until), numFmt: "yyyy-mm-dd" },
      { header: "Created", width: 16, value: (r) => dateOnly(r.created_at), numFmt: "yyyy-mm-dd" },
    ],
  },
};

function addSheet(
  wb: ExcelJS.Workbook,
  title: string,
  columns: Column[],
  rows: Record<string, unknown>[],
) {
  const ws = wb.addWorksheet(title);
  ws.columns = columns.map((c, i) => ({ header: c.header, key: `c${i}`, width: c.width }));
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = HEADER_FILL;
  ws.views = [{ state: "frozen", ySplit: 1 }];
  const lastCol = ws.getColumn(columns.length);
  ws.autoFilter = { from: "A1", to: `${lastCol.letter}1` };
  for (const row of rows) {
    const values = columns.map((c) => c.value(row));
    const excelRow = ws.addRow(values);
    columns.forEach((c, i) => {
      if (c.numFmt && values[i] !== null && values[i] !== "") {
        excelRow.getCell(i + 1).numFmt = c.numFmt;
      }
    });
  }
}

/** Full Front Office data export: one workbook, a sheet per entity. */
const FULL_SHEETS: (SingleType | "jobs" | "quotes")[] = [
  "customers",
  "jobs",
  "quotes",
  "invoices",
  "conversations",
];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  if (!(TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ error: "Unknown export type." }, { status: 404 });
  }
  const t = type as ExportType;

  const active = await getActiveMembership();
  if (!active) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { membership, company } = active;
  if (!isStaff(membership.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const rl = await rateLimit("export", 20, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many exports. Try again later." }, { status: 429 });
  }

  const supabase = await createClient();
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim();
  const status = sp.get("status") ?? "all";
  const custType = sp.get("type") ?? "all";
  const ctx: Ctx = {
    supabase,
    companyId: company.id,
    timezone: company.timezone || "America/New_York",
    q,
    like: sanitizeLike(q),
    status,
    custType,
    periodStart: periodStartUtc(company.timezone || "America/New_York", parsePeriod(sp.get("period"))),
  };

  const wb = new ExcelJS.Workbook();
  wb.creator = "TidyPro";
  wb.created = new Date();

  const filename = `tidypro-${t}`;
  if (t === "full") {
    for (const sheet of FULL_SHEETS) {
      const rows = await fetchRows(sheet, { ...ctx, q: "", like: "%%", status: "all" });
      const { title, columns } = COLUMNS[sheet];
      addSheet(wb, title, columns, rows);
    }
  } else {
    const rows = await fetchRows(t, ctx);
    const { title, columns } = COLUMNS[t];
    addSheet(wb, title, columns, rows);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const bytes = Buffer.from(buffer);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(bytes, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}-${stamp}.xlsx"`,
      "Content-Length": String(bytes.byteLength),
    },
  });
}
