import Link from "next/link";
import { getPortalContext } from "@/lib/portal";
import { createServiceClient } from "@/lib/supabase/server";
import { PortalShell, PortalInvalid } from "@/components/portal/portal-shell";
import { getLogoViewUrl } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardIcon } from "@/components/ui/icons";
import { formatCents, formatDate, formatTime } from "@/lib/format";

export const instant = false;

/** Customer portal home: upcoming visits, open quotes, open invoices. */
export default async function PortalHomePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ctx = await getPortalContext(token);
  if (!ctx) return <PortalInvalid />;
  const logoUrl = await getLogoViewUrl(ctx.company.logo_url);

  const svc = await createServiceClient();
  const now = new Date().toISOString();

  const [{ data: bookings }, { data: quotes }, { data: invoices }] = await Promise.all([
    svc
      .from("bookings")
      .select("id, scheduled_start, scheduled_end, status, recurrence, service_addresses(address_line1, city)")
      .eq("company_id", ctx.company.id)
      .eq("customer_id", ctx.customer.id)
      .neq("status", "canceled")
      .gte("scheduled_start", now)
      .order("scheduled_start", { ascending: true })
      .limit(5),
    svc
      .from("quotes")
      .select("id, quote_number, status, total_cents, valid_until")
      .eq("company_id", ctx.company.id)
      .eq("customer_id", ctx.customer.id)
      .eq("status", "sent")
      .order("created_at", { ascending: false })
      .limit(5),
    svc
      .from("invoices")
      .select("id, invoice_number, status, total_cents, amount_paid_cents, due_date")
      .eq("company_id", ctx.company.id)
      .eq("customer_id", ctx.customer.id)
      .in("status", ["sent", "overdue"])
      .order("due_date", { ascending: true })
      .limit(5),
  ]);

  const tz = ctx.company.timezone;

  return (
    <PortalShell companyName={ctx.company.name} customerName={ctx.customer.name} logoUrl={logoUrl}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome, {ctx.customer.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
            Your upcoming cleanings, quotes awaiting approval, and invoices.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming visits</CardTitle>
          </CardHeader>
          <CardContent>
            {(bookings ?? []).length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">No upcoming visits scheduled.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {(bookings ?? []).map((b) => {
                  const addr = Array.isArray(b.service_addresses) ? b.service_addresses[0] : b.service_addresses;
                  return (
                    <li key={b.id} className="py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {formatDate(b.scheduled_start)}, {formatTime(b.scheduled_start, tz)} –{" "}
                        {formatTime(b.scheduled_end, tz)}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                        {addr?.address_line1}, {addr?.city}
                        {b.recurrence !== "none" && ` · repeats ${b.recurrence}`}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quotes awaiting your approval</CardTitle>
          </CardHeader>
          <CardContent>
            {(quotes ?? []).length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">No quotes waiting right now.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {(quotes ?? []).map((q) => (
                  <li key={q.id}>
                    <Link href={`/p/${token}/quotes/${q.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900 dark:text-slate-100">{q.quote_number}</p>
                        <p className="truncate text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                          {q.valid_until ? `Valid until ${formatDate(q.valid_until)}` : "No expiry"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-semibold">{formatCents(q.total_cents)}</span>
                        <Badge tone="brand">Review →</Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {(invoices ?? []).length === 0 ? (
              <EmptyState
                title="All paid up"
                description="You have no open invoices."
                icon={<CardIcon className="h-10 w-10" />}
              />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {(invoices ?? []).map((inv) => (
                  <li key={inv.id}>
                    <Link href={`/p/${token}/invoices/${inv.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900 dark:text-slate-100">{inv.invoice_number}</p>
                        <p className="truncate text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                          {inv.due_date ? `Due ${formatDate(inv.due_date)}` : "No due date"} ·{" "}
                          {formatCents(inv.total_cents - inv.amount_paid_cents)} due
                        </p>
                      </div>
                      <Badge tone={inv.status === "overdue" ? "red" : "brand"} className="shrink-0">
                        {inv.status === "overdue" ? "Overdue — pay" : "Pay →"}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Questions? Call {ctx.company.name}
          {ctx.company.phone ? ` at ${ctx.company.phone}` : ""}.
        </p>
      </div>
    </PortalShell>
  );
}
