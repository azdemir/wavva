import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { hasFeature, isPlanId } from "@/lib/plans";
import { formatCents } from "@/lib/format";

export const instant = false;

type InvoiceRow = {
  total_cents: number;
  amount_paid_cents: number;
  status: string;
  created_at: string;
  customers: { name: string } | null;
};

type JobRow = {
  status: string;
  scheduled_start: string;
};

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default async function ReportsPage() {
  const { company } = await requireCompany();
  const plan = isPlanId(company.plan) ? company.plan : "starter";

  if (!hasFeature(plan, "reports")) {
    return (
      <div className="space-y-6">
        <Heading
          title="Reports"
          description="Revenue, jobs, and customer insights."
        />
        <UpgradePrompt feature="reports" />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: invoices }, { data: jobs }] = await Promise.all([
    supabase
      .from("invoices")
      .select("total_cents, amount_paid_cents, status, created_at, customers(name)")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("jobs")
      .select("status, scheduled_start")
      .eq("company_id", company.id)
      .order("scheduled_start", { ascending: false })
      .limit(1000),
  ]);

  const invRows = (invoices ?? []) as unknown as InvoiceRow[];
  const jobRows = (jobs ?? []) as unknown as JobRow[];

  // Revenue by month (paid invoices).
  const revenueByMonth = new Map<string, number>();
  // Jobs completed by month.
  const jobsByMonth = new Map<string, number>();
  // Revenue by customer.
  const revenueByCustomer = new Map<string, number>();
  let outstanding = 0;

  for (const inv of invRows) {
    const key = monthKey(inv.created_at);
    if (inv.status === "paid") {
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + inv.total_cents);
      const name = one(inv.customers)?.name ?? "Unknown";
      revenueByCustomer.set(name, (revenueByCustomer.get(name) ?? 0) + inv.total_cents);
    } else if (inv.status === "sent" || inv.status === "overdue") {
      outstanding += inv.total_cents - inv.amount_paid_cents;
    }
  }
  for (const job of jobRows) {
    if (job.status === "completed") {
      const key = monthKey(job.scheduled_start);
      jobsByMonth.set(key, (jobsByMonth.get(key) ?? 0) + 1);
    }
  }

  const months = [...new Set([...revenueByMonth.keys(), ...jobsByMonth.keys()])]
    .sort()
    .reverse()
    .slice(0, 6);
  const maxRevenue = Math.max(1, ...months.map((m) => revenueByMonth.get(m) ?? 0));
  const topCustomers = [...revenueByCustomer.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalRevenue = [...revenueByMonth.values()].reduce((a, b) => a + b, 0);
  const totalJobs = [...jobsByMonth.values()].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <Heading
        title="Reports"
        description="Revenue, jobs, and customer insights."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total revenue (paid)</p>
            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {formatCents(totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Jobs completed</p>
            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {totalJobs}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Outstanding</p>
            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {formatCents(outstanding)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by month</CardTitle>
        </CardHeader>
        <CardContent>
          {months.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No paid invoices yet.</p>
          ) : (
            <div className="space-y-3">
              {months.map((m) => {
                const val = revenueByMonth.get(m) ?? 0;
                const pct = Math.round((val / maxRevenue) * 100);
                return (
                  <div key={m}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {monthLabel(m)}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatCents(val)}
                      </span>
                    </div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Jobs completed by month</CardTitle>
          </CardHeader>
          <CardContent>
            {months.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No completed jobs yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {months.map((m) => (
                  <li key={m} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{monthLabel(m)}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {jobsByMonth.get(m) ?? 0} jobs
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top customers by revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No paid invoices yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {topCustomers.map(([name, cents]) => (
                  <li key={name} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                      {name}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatCents(cents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
