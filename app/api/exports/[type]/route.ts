import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getActiveMembership } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { rateLimit } from "@/lib/rate-limit";

const MAX_ROWS = 5000;
const TYPES = ["customers", "invoices", "bookings"] as const;
type ExportType = (typeof TYPES)[number];

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

const COLUMNS: Record<ExportType, { title: string; columns: Column[] }> = {
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
};

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
  const like = sanitizeLike(q);

  let rows: Record<string, unknown>[] = [];

  if (t === "customers") {
    let query = supabase
      .from("customers")
      .select("name, customer_type, email, phone, sms_consent, notes, created_at")
      .eq("company_id", company.id)
      .order("name", { ascending: true })
      .limit(MAX_ROWS);
    if (custType === "residential" || custType === "commercial") {
      query = query.eq("customer_type", custType);
    }
    if (q) query = query.or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like}`);
    const { data } = await query;
    rows = (data ?? []) as Record<string, unknown>[];
  } else if (t === "invoices") {
    let query = supabase
      .from("invoices")
      .select(
        "invoice_number, status, subtotal_cents, tax_cents, total_cents, amount_paid_cents, due_date, created_at, customers(name)",
      )
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS);
    if (status !== "all") query = query.eq("status", status);
    if (q) {
      const ids = await matchingCustomerIds(supabase, company.id, q);
      query =
        ids.length > 0
          ? query.or(`invoice_number.ilike.${like},customer_id.in.(${ids.join(",")})`)
          : query.ilike("invoice_number", like);
    }
    const { data } = await query;
    rows = (data ?? []) as Record<string, unknown>[];
  } else {
    let query = supabase
      .from("bookings")
      .select(
        "booking_number, status, recurrence, scheduled_start, scheduled_end, notes, customers(name), service_addresses(address_line1, city, state, zip)",
      )
      .eq("company_id", company.id)
      .order("scheduled_start", { ascending: false })
      .limit(MAX_ROWS);
    if (status !== "all") query = query.eq("status", status);
    if (q) {
      const ids = await matchingCustomerIds(supabase, company.id, q);
      query =
        ids.length > 0
          ? query.or(`booking_number.ilike.${like},customer_id.in.(${ids.join(",")})`)
          : query.ilike("booking_number", like);
    }
    const { data } = await query;
    rows = (data ?? []) as Record<string, unknown>[];
  }

  const { title, columns } = COLUMNS[t];
  const wb = new ExcelJS.Workbook();
  wb.creator = "TidyPro";
  wb.created = new Date();
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

  const buffer = await wb.xlsx.writeBuffer();
  const bytes = Buffer.from(buffer);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(bytes, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="tidypro-${t}-${stamp}.xlsx"`,
      "Content-Length": String(bytes.byteLength),
    },
  });
}
