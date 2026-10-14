import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requirePlatformAdmin } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";
import {
  getAnalytics,
  parseAnalyticsFilter,
  type AnalyticsData,
} from "@/lib/studio/analytics";
import { PLANS } from "@/lib/plans";
import { crmStageLabel, crmSourceLabel } from "@/lib/studio/crm";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1D4ED8" },
};

function addSheet(
  wb: ExcelJS.Workbook,
  title: string,
  headers: { header: string; width: number }[],
  rows: (string | number | Date | null)[][],
  numFmts?: Record<number, string>,
) {
  const ws = wb.addWorksheet(title);
  ws.columns = headers.map((h, i) => ({ header: h.header, key: `c${i}`, width: h.width }));
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = HEADER_FILL;
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: "A1", to: `${ws.getColumn(headers.length).letter}1` };
  for (const row of rows) {
    const excelRow = ws.addRow(row);
    if (numFmts) {
      for (const [idx, fmt] of Object.entries(numFmts)) {
        const v = row[Number(idx)];
        if (v !== null && v !== "") excelRow.getCell(Number(idx) + 1).numFmt = fmt;
      }
    }
  }
  return ws;
}

const MONEY_FMT = '"$"#,##0.00';
const DATE_FMT = "yyyy-mm-dd";
const PCT_FMT = "0.0%";

function buildWorkbook(data: AnalyticsData): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Switchboard Studio";
  wb.created = new Date();

  const summary = addSheet(
    wb,
    "Summary",
    [
      { header: "Metric", width: 28 },
      { header: "Value", width: 20 },
    ],
    [
      ["Companies", data.companies],
      ["Users", data.users],
      ["MRR ($)", data.mrrCents / 100],
      ["Paying companies", data.payingCompanies],
      ["Trialing companies", data.trialingCompanies],
      ["Total leads", data.leads],
      ["Customers (from leads)", data.customers],
      ["Lead → customer rate", data.leadToCustomerPct],
      ["Open pipeline ($)", data.pipelineCents / 100],
    ],
  );
  // Data rows start at row 2: MRR = row 4, rate = row 9, pipeline = row 10.
  summary.getCell("B4").numFmt = MONEY_FMT;
  summary.getCell("B9").numFmt = PCT_FMT;
  summary.getCell("B10").numFmt = MONEY_FMT;

  addSheet(
    wb,
    "Weekly signups",
    [
      { header: "Week starting", width: 16 },
      { header: "New companies", width: 15 },
      { header: "New leads", width: 12 },
    ],
    data.weeks.map((w) => [
      new Date(w.start),
      w.companies,
      w.leads,
    ]),
    { 0: DATE_FMT },
  );

  addSheet(
    wb,
    "Plan mix",
    [
      { header: "Plan", width: 14 },
      { header: "Price/mo ($)", width: 14 },
      { header: "Companies", width: 12 },
      { header: "MRR ($)", width: 12 },
    ],
    data.planMix.map((m) => [
      PLANS[m.plan].name,
      PLANS[m.plan].priceCents / 100,
      m.count,
      m.mrrCents / 100,
    ]),
    { 1: MONEY_FMT, 3: MONEY_FMT },
  );

  addSheet(
    wb,
    "Funnel",
    [
      { header: "Stage", width: 16 },
      { header: "Leads", width: 10 },
      { header: "Conversion from previous", width: 24 },
    ],
    data.funnel.map((s) => [
      crmStageLabel(s.stage),
      s.count,
      s.conversionFromPrev,
    ]),
    { 2: PCT_FMT },
  );

  addSheet(
    wb,
    "Lead sources",
    [
      { header: "Source", width: 20 },
      { header: "Leads", width: 10 },
    ],
    data.sources.map((s) => [crmSourceLabel(s.source), s.count]),
  );

  addSheet(
    wb,
    "Companies",
    [
      { header: "Company", width: 30 },
      { header: "Plan", width: 12 },
      { header: "Customers", width: 12 },
      { header: "Subscription status", width: 20 },
      { header: "Joined", width: 14 },
    ],
    data.recent.map((c) => [
      c.name,
      PLANS[c.plan as keyof typeof PLANS]?.name ?? c.plan,
      c.customers,
      c.status ?? "",
      new Date(c.createdAt),
    ]),
    { 4: DATE_FMT },
  );

  return wb;
}

/**
 * Studio analytics Excel export (platform admin only). Honors the same
 * filters as the analytics page: ?weeks=4|12|26&plan=all|starter|growth|pro&q=…
 */
export async function GET(req: Request) {
  try {
    await requirePlatformAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const rl = await rateLimit("studio-export", 20, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many exports. Try again later." }, { status: 429 });
  }

  const sp = new URL(req.url).searchParams;
  const filter = parseAnalyticsFilter({
    weeks: sp.get("weeks") ?? undefined,
    plan: sp.get("plan") ?? undefined,
    q: sp.get("q") ?? undefined,
  });

  let data: AnalyticsData;
  try {
    data = await getAnalytics(filter);
  } catch {
    return NextResponse.json(
      { error: "Analytics isn't available — check the Supabase connection and migrations." },
      { status: 500 },
    );
  }

  const wb = buildWorkbook(data);
  const buffer = await wb.xlsx.writeBuffer();
  const bytes = Buffer.from(buffer);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(bytes, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="switchboard-studio-analytics-${stamp}.xlsx"`,
      "Content-Length": String(bytes.byteLength),
    },
  });
}
