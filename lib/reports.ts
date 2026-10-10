import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";

const ROW_LIMIT = 5000;

export type ReportPreset =
  | "7d"
  | "30d"
  | "90d"
  | "this_month"
  | "last_month"
  | "this_year"
  | "custom";

export type DateRange = { from: Date; to: Date; preset: ReportPreset };

/** Resolve preset/custom dates to an inclusive UTC day range. */
export function resolveReportRange(
  preset: ReportPreset,
  fromStr?: string,
  toStr?: string,
): DateRange {
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const endOfDay = (d: Date) =>
    new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999),
    );
  const today = startOfDay(now);

  if (preset === "custom" && fromStr && toStr) {
    const from = startOfDay(new Date(`${fromStr}T00:00:00Z`));
    const to = endOfDay(new Date(`${toStr}T00:00:00Z`));
    if (!isNaN(from.getTime()) && !isNaN(to.getTime()) && from <= to) {
      return { from, to, preset };
    }
  }

  let from: Date;
  let to: Date = endOfDay(now);
  switch (preset) {
    case "7d":
      from = new Date(today.getTime() - 6 * 86400000);
      break;
    case "90d":
      from = new Date(today.getTime() - 89 * 86400000);
      break;
    case "this_month":
      from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      break;
    case "last_month": {
      const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      to = new Date(first.getTime() - 1);
      break;
    }
    case "this_year":
      from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      break;
    case "30d":
    default:
      from = new Date(today.getTime() - 29 * 86400000);
      break;
  }
  return { from, to, preset };
}

export function isReportPreset(v: unknown): v is ReportPreset {
  return (
    v === "7d" ||
    v === "30d" ||
    v === "90d" ||
    v === "this_month" ||
    v === "last_month" ||
    v === "this_year" ||
    v === "custom"
  );
}

type JobRow = {
  id: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  started_at: string | null;
  completed_at: string | null;
  assigned_user_ids: string[] | null;
  customers: { name: string } | null;
  bookings: { services: { name: string } | null } | null;
};

/** Hours for one job: actual times when recorded, otherwise the schedule. */
export function jobHours(job: {
  scheduled_start: string;
  scheduled_end: string;
  started_at?: string | null;
  completed_at?: string | null;
}): number {
  const start = job.started_at ?? job.scheduled_start;
  const end = job.completed_at ?? job.scheduled_end;
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms > 0 ? ms / 3600000 : 0;
}

export type EmployeeHoursRow = {
  userId: string;
  email: string;
  role: string;
  jobsCompleted: number;
  hours: number;
  sharePct: number;
};

export type ReportData = {
  range: DateRange;
  kpis: {
    revenuePaidCents: number;
    outstandingCents: number;
    jobsCompleted: number;
    hoursWorked: number;
    avgInvoiceCents: number;
    quoteWinRatePct: number | null;
  };
  employeeHours: EmployeeHoursRow[];
  unassignedHours: number;
  unassignedJobs: number;
  revenueByMonth: { key: string; cents: number }[];
  revenueByCustomer: { name: string; cents: number }[];
  revenueByService: { service: string; cents: number }[];
  jobsByStatus: { scheduled: number; in_progress: number; completed: number; canceled: number };
  jobsByService: { service: string; count: number }[];
  avgJobHours: number;
  quotes: {
    sent: number;
    approved: number;
    declined: number;
    expired: number;
    quotedCents: number;
  };
  jobs: {
    id: string;
    date: string;
    customer: string;
    service: string;
    status: string;
    hours: number;
    crew: string[];
  }[];
  invoices: {
    number: string;
    customer: string;
    status: string;
    date: string;
    totalCents: number;
    paidCents: number;
  }[];
  quotesList: {
    number: string;
    customer: string;
    status: string;
    date: string;
    totalCents: number;
  }[];
};

function inRange(iso: string, from: Date, to: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t <= to.getTime();
}

/**
 * Everything the reports page (and its Excel exports) need, in one call.
 * All queries are company-scoped; the caller enforces reports.view.
 */
export async function getReportData(
  companyId: string,
  range: DateRange,
): Promise<ReportData> {
  const supabase = await createClient();
  const { from, to } = range;

  const [
    { data: invoicesRaw },
    { data: jobsRaw },
    { data: quotesRaw },
    { data: membersRaw },
    { data: bookingsRaw },
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select(
        "invoice_number, status, total_cents, amount_paid_cents, created_at, customers(name)",
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(ROW_LIMIT),
    supabase
      .from("jobs")
      .select(
        "id, status, scheduled_start, scheduled_end, started_at, completed_at, assigned_user_ids, customers(name), bookings(services(name))",
      )
      .eq("company_id", companyId)
      .order("scheduled_start", { ascending: false })
      .limit(ROW_LIMIT),
    supabase
      .from("quotes")
      .select("quote_number, status, total_cents, created_at, customers(name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(ROW_LIMIT),
    supabase
      .from("memberships")
      .select("user_id, email, role")
      .eq("company_id", companyId),
    supabase
      .from("bookings")
      .select("id, status, scheduled_start, services(name)")
      .eq("company_id", companyId)
      .order("scheduled_start", { ascending: false })
      .limit(ROW_LIMIT),
  ]);

  type InvoiceRow = {
    invoice_number: string;
    status: string;
    total_cents: number;
    amount_paid_cents: number;
    created_at: string;
    customers: { name: string } | null;
  };
  const invoices = (invoicesRaw ?? []) as unknown as InvoiceRow[];
  const jobs = (jobsRaw ?? []) as unknown as JobRow[];
  const quotes = ((quotesRaw ?? []) as unknown as {
    quote_number: string;
    status: string;
    total_cents: number;
    created_at: string;
    customers: { name: string } | null;
  }[]);
  const members = ((membersRaw ?? []) as unknown as {
    user_id: string;
    email: string;
    role: string;
  }[]);
  const bookings = ((bookingsRaw ?? []) as unknown as {
    id: string;
    status: string;
    scheduled_start: string;
    services: { name: string } | null;
  }[]);

  const emailByUserId = new Map(members.map((m) => [m.user_id, m.email]));

  // ---- Invoices: revenue (in range, paid) + outstanding (point in time)
  let revenuePaidCents = 0;
  let paidCount = 0;
  let outstandingCents = 0;
  const revenueByMonth = new Map<string, number>();
  const revenueByCustomer = new Map<string, number>();
  const invoiceExport: ReportData["invoices"] = [];

  for (const inv of invoices) {
    const inR = inRange(inv.created_at, from, to);
    if (inv.status === "paid" && inR) {
      revenuePaidCents += inv.total_cents;
      paidCount += 1;
      const key = inv.created_at.slice(0, 7);
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + inv.total_cents);
      const name = one(inv.customers)?.name ?? "—";
      revenueByCustomer.set(name, (revenueByCustomer.get(name) ?? 0) + inv.total_cents);
    }
    if (inv.status === "sent" || inv.status === "overdue") {
      outstandingCents += Math.max(0, inv.total_cents - inv.amount_paid_cents);
    }
    if (inR) {
      invoiceExport.push({
        number: inv.invoice_number,
        customer: one(inv.customers)?.name ?? "—",
        status: inv.status,
        date: inv.created_at,
        totalCents: inv.total_cents,
        paidCents: inv.amount_paid_cents,
      });
    }
  }

  // ---- Revenue by service: line items of paid invoices in range
  const revenueByService = new Map<string, number>();
  const paidIds = invoices
    .filter((i) => i.status === "paid" && inRange(i.created_at, from, to))
    .map((i) => i.invoice_number);
  if (paidIds.length > 0) {
    // Match line items through their invoices (chunked to stay under limits).
    const { data: lineItems } = await supabase
      .from("invoice_line_items")
      .select("label, line_total_cents, invoices!inner(invoice_number, status, created_at)")
      .eq("company_id", companyId)
      .limit(ROW_LIMIT);
    for (const li of (lineItems ?? []) as unknown as {
      label: string;
      line_total_cents: number;
      invoices: { invoice_number: string; status: string; created_at: string };
    }[]) {
      const inv = one(li.invoices as unknown as { invoice_number: string; status: string; created_at: string } | null);
      if (inv && inv.status === "paid" && inRange(inv.created_at, from, to)) {
        const label = li.label?.trim() || "—";
        revenueByService.set(label, (revenueByService.get(label) ?? 0) + li.line_total_cents);
      }
    }
  }

  // ---- Jobs: status, hours, per-employee
  const jobsByStatus = { scheduled: 0, in_progress: 0, completed: 0, canceled: 0 };
  const perEmployee = new Map<string, { jobsCompleted: number; hours: number }>();
  for (const m of members) perEmployee.set(m.user_id, { jobsCompleted: 0, hours: 0 });
  let hoursWorked = 0;
  let unassignedHours = 0;
  let unassignedJobs = 0;
  let completedHoursSum = 0;
  const jobExport: ReportData["jobs"] = [];

  for (const job of jobs) {
    const inR = inRange(job.scheduled_start, from, to);
    if (inR && job.status in jobsByStatus) {
      jobsByStatus[job.status as keyof typeof jobsByStatus] += 1;
    }
    if (job.status === "completed" && inR) {
      const h = jobHours(job);
      hoursWorked += h;
      completedHoursSum += h;
      const crew = job.assigned_user_ids ?? [];
      const crewEmails = crew.map((u) => emailByUserId.get(u) ?? "—");
      if (crew.length === 0) {
        unassignedHours += h;
        unassignedJobs += 1;
      } else {
        for (const uid of crew) {
          const e = perEmployee.get(uid) ?? { jobsCompleted: 0, hours: 0 };
          e.jobsCompleted += 1;
          e.hours += h;
          perEmployee.set(uid, e);
        }
      }
      jobExport.push({
        id: job.id,
        date: job.scheduled_start,
        customer: one(job.customers)?.name ?? "—",
        service: one(one(job.bookings)?.services)?.name ?? "—",
        status: job.status,
        hours: Math.round(h * 100) / 100,
        crew: crewEmails,
      });
    }
  }

  const employeeHours: EmployeeHoursRow[] = members.map((m) => {
    const e = perEmployee.get(m.user_id) ?? { jobsCompleted: 0, hours: 0 };
    return {
      userId: m.user_id,
      email: m.email,
      role: m.role,
      jobsCompleted: e.jobsCompleted,
      hours: Math.round(e.hours * 100) / 100,
      sharePct: hoursWorked > 0 ? Math.round((e.hours / hoursWorked) * 1000) / 10 : 0,
    };
  }).sort((a, b) => b.hours - a.hours);

  // ---- Jobs by service (bookings in range)
  const jobsByService = new Map<string, number>();
  for (const b of bookings) {
    if (!inRange(b.scheduled_start, from, to)) continue;
    if (b.status === "canceled") continue;
    const name = one(b.services)?.name ?? "—";
    jobsByService.set(name, (jobsByService.get(name) ?? 0) + 1);
  }

  // ---- Quotes
  const q = { sent: 0, approved: 0, declined: 0, expired: 0, quotedCents: 0 };
  const quotesList: ReportData["quotesList"] = [];
  for (const quote of quotes) {
    if (!inRange(quote.created_at, from, to)) continue;
    if (quote.status === "sent") q.sent += 1;
    else if (quote.status === "approved") q.approved += 1;
    else if (quote.status === "declined") q.declined += 1;
    else if (quote.status === "expired") q.expired += 1;
    if (quote.status !== "draft") q.quotedCents += quote.total_cents;
    quotesList.push({
      number: quote.quote_number,
      customer: one(quote.customers)?.name ?? "—",
      status: quote.status,
      date: quote.created_at,
      totalCents: quote.total_cents,
    });
  }
  const decided = q.approved + q.declined;
  const quoteWinRatePct = decided > 0 ? Math.round((q.approved / decided) * 1000) / 10 : null;

  const completedJobs = jobsByStatus.completed;
  const sortedMonths = [...revenueByMonth.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, cents]) => ({ key, cents }));

  return {
    range,
    kpis: {
      revenuePaidCents,
      outstandingCents,
      jobsCompleted: completedJobs,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      avgInvoiceCents: paidCount > 0 ? Math.round(revenuePaidCents / paidCount) : 0,
      quoteWinRatePct,
    },
    employeeHours,
    unassignedHours: Math.round(unassignedHours * 100) / 100,
    unassignedJobs,
    revenueByMonth: sortedMonths,
    revenueByCustomer: [...revenueByCustomer.entries()]
      .map(([name, cents]) => ({ name, cents }))
      .sort((a, b) => b.cents - a.cents)
      .slice(0, 10),
    revenueByService: [...revenueByService.entries()]
      .map(([service, cents]) => ({ service, cents }))
      .sort((a, b) => b.cents - a.cents)
      .slice(0, 8),
    jobsByStatus,
    jobsByService: [...jobsByService.entries()]
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count),
    avgJobHours:
      completedJobs > 0 ? Math.round((completedHoursSum / completedJobs) * 100) / 100 : 0,
    quotes: q,
    jobs: jobExport,
    invoices: invoiceExport,
    quotesList,
  };
}
