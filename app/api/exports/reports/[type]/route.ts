import ExcelJS from "exceljs";
import { getActiveMembership } from "@/lib/auth";
import { can, type Role } from "@/lib/permissions";
import { rateLimit } from "@/lib/rate-limit";
import {
  getReportData,
  isReportPreset,
  resolveReportRange,
  type ReportData,
} from "@/lib/reports";

const TYPES = ["employee-hours", "revenue", "jobs", "quotes"] as const;
type ExportType = (typeof TYPES)[number];

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1D4ED8" },
};

const MONEY_FMT = '"$"#,##0.00';
const DATE_FMT = "yyyy-mm-dd hh:mm";

const money = (cents: unknown): number | null =>
  typeof cents === "number" ? cents / 100 : null;
const dateVal = (iso: unknown): Date | null =>
  typeof iso === "string" && iso ? new Date(iso) : null;

function styleSheet(ws: ExcelJS.Worksheet) {
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = HEADER_FILL;
  ws.views = [{ state: "frozen", ySplit: 1 }];
  const lastCol = ws.getColumn(ws.columnCount);
  ws.autoFilter = { from: "A1", to: `${lastCol.letter}1` };
}

function addSheet(
  wb: ExcelJS.Workbook,
  title: string,
  headers: { header: string; width: number; numFmt?: string }[],
  rows: (string | number | Date | null)[][],
) {
  const ws = wb.addWorksheet(title);
  ws.columns = headers.map((h, i) => ({
    header: h.header,
    key: `c${i}`,
    width: h.width,
  }));
  for (const row of rows) {
    const excelRow = ws.addRow(row);
    headers.forEach((h, i) => {
      if (h.numFmt && row[i] !== null && row[i] !== "") {
        excelRow.getCell(i + 1).numFmt = h.numFmt;
      }
    });
  }
  styleSheet(ws);
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function buildWorkbook(t: ExportType, data: ReportData): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Switchboard";
  wb.created = new Date();

  if (t === "employee-hours") {
    addSheet(
      wb,
      "Employee hours",
      [
        { header: "Employee", width: 32 },
        { header: "Role", width: 12 },
        { header: "Jobs completed", width: 16 },
        { header: "Hours worked", width: 14 },
        { header: "Share of total hours", width: 20 },
      ],
      data.employeeHours.map((e) => [
        e.email,
        e.role,
        e.jobsCompleted,
        e.hours,
        e.sharePct / 100,
      ]),
    );
    const ws = wb.getWorksheet("Employee hours")!;
    ws.getColumn(5).numFmt = "0.0%";
    if (data.unassignedJobs > 0) {
      ws.addRow([
        "Unassigned jobs",
        "—",
        data.unassignedJobs,
        data.unassignedHours,
        null,
      ]);
    }
    ws.addRow([
      "TOTAL",
      "",
      data.employeeHours.reduce((a, e) => a + e.jobsCompleted, 0) + data.unassignedJobs,
      data.kpis.hoursWorked,
      null,
    ]).font = { bold: true };
  }

  if (t === "revenue") {
    addSheet(
      wb,
      "By month",
      [
        { header: "Month", width: 16 },
        { header: "Revenue (paid)", width: 16, numFmt: MONEY_FMT },
      ],
      data.revenueByMonth.map((r) => [monthLabel(r.key), money(r.cents)]),
    );
    addSheet(
      wb,
      "By customer",
      [
        { header: "Customer", width: 30 },
        { header: "Revenue (paid)", width: 16, numFmt: MONEY_FMT },
      ],
      data.revenueByCustomer.map((r) => [r.name, money(r.cents)]),
    );
    addSheet(
      wb,
      "By service",
      [
        { header: "Service", width: 34 },
        { header: "Revenue (paid)", width: 16, numFmt: MONEY_FMT },
      ],
      data.revenueByService.map((r) => [r.service, money(r.cents)]),
    );
  }

  if (t === "jobs") {
    addSheet(
      wb,
      "By status",
      [{ header: "Status", width: 16 }, { header: "Count", width: 12 }],
      [
        ["Scheduled", data.jobsByStatus.scheduled],
        ["In progress", data.jobsByStatus.in_progress],
        ["Completed", data.jobsByStatus.completed],
        ["Canceled", data.jobsByStatus.canceled],
      ],
    );
    addSheet(
      wb,
      "By service",
      [{ header: "Service", width: 34 }, { header: "Jobs", width: 12 }],
      data.jobsByService.map((r) => [r.service, r.count]),
    );
    addSheet(
      wb,
      "Completed jobs",
      [
        { header: "Date", width: 18, numFmt: DATE_FMT },
        { header: "Customer", width: 26 },
        { header: "Service", width: 24 },
        { header: "Status", width: 14 },
        { header: "Hours", width: 10 },
        { header: "Crew", width: 40 },
      ],
      data.jobs.map((j) => [
        dateVal(j.date),
        j.customer,
        j.service,
        j.status,
        j.hours,
        j.crew.join(", "),
      ]),
    );
  }

  if (t === "quotes") {
    addSheet(
      wb,
      "Summary",
      [{ header: "Metric", width: 22 }, { header: "Value", width: 16 }],
      [
        ["Sent", data.quotes.sent],
        ["Approved", data.quotes.approved],
        ["Declined", data.quotes.declined],
        ["Expired", data.quotes.expired],
        [
          "Win rate",
          data.kpis.quoteWinRatePct === null ? "—" : `${data.kpis.quoteWinRatePct}%`,
        ],
        ["Quoted value", money(data.quotes.quotedCents)],
      ],
    );
    const ws = wb.getWorksheet("Summary")!;
    ws.getCell("B6").numFmt = MONEY_FMT;
    addSheet(
      wb,
      "Quotes",
      [
        { header: "Quote #", width: 14 },
        { header: "Customer", width: 26 },
        { header: "Status", width: 12 },
        { header: "Date", width: 18, numFmt: DATE_FMT },
        { header: "Total", width: 14, numFmt: MONEY_FMT },
      ],
      data.quotesList.map((q) => [
        q.number,
        q.customer,
        q.status,
        dateVal(q.date),
        money(q.totalCents),
      ]),
    );
  }

  return wb;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  if (!(TYPES as readonly string[]).includes(type)) {
    return new Response(JSON.stringify({ error: "Unknown export type." }), {
      status: 404,
    });
  }
  const t = type as ExportType;

  // Owner-only: reports.view (managers are denied).
  const active = await getActiveMembership();
  if (!active) {
    return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401 });
  }
  if (!can(active.membership.role as Role, "reports.view")) {
    return new Response(JSON.stringify({ error: "Forbidden." }), { status: 403 });
  }

  const rl = await rateLimit("reports-export", 20, 60 * 60 * 1000);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many exports. Try again later." }),
      { status: 429 },
    );
  }

  const sp = new URL(req.url).searchParams;
  const presetRaw = sp.get("preset") ?? "30d";
  const preset = isReportPreset(presetRaw) ? presetRaw : "30d";
  const range = resolveReportRange(preset, sp.get("from") ?? undefined, sp.get("to") ?? undefined);
  const data = await getReportData(active.company.id, range);

  const wb = buildWorkbook(t, data);
  const buffer = await wb.xlsx.writeBuffer();
  const bytes = Buffer.from(buffer);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(bytes, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="switchboard-report-${t}-${stamp}.xlsx"`,
      "Content-Length": String(bytes.byteLength),
    },
  });
}
