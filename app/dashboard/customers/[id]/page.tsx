import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { updateCustomer, deleteCustomer, deleteAddress } from "@/lib/actions/customers";
import { isCustomerEmailTaken } from "@/lib/actions/customer-duplicates";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Badge, type JobStatus, type QuoteStatus } from "@/components/ui/badge";
import { TJobStatusPill, TQuoteStatusPill } from "@/components/ui/translated-status-pill";
import { CustomerForm } from "@/components/customers/customer-form";
import { AddressForm } from "@/components/customers/address-form";
import { PortalLinkButton } from "@/components/portal/portal-link-button";
import { formatCents, formatDate } from "@/lib/format";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requirePermission("customers.manage");
  const t = await getTranslations("customers");
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("company_id", company.id)
    .single();
  if (!customer) notFound();

  const h = await headers();
  const baseUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  const [{ data: addresses }, { data: bookings }, { data: quotes }] = await Promise.all([
    supabase
      .from("service_addresses")
      .select("*")
      .eq("customer_id", id)
      .eq("company_id", company.id)
      .order("is_default", { ascending: false }),
    supabase
      .from("bookings")
      .select("id, booking_number, scheduled_start, status")
      .eq("customer_id", id)
      .eq("company_id", company.id)
      .order("scheduled_start", { ascending: false })
      .limit(10),
    supabase
      .from("quotes")
      .select("id, quote_number, status, total_cents")
      .eq("customer_id", id)
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <Heading title={customer.name} description={t("detail.description")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.detailsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm
            initial={{
              name: customer.name,
              customer_type: customer.customer_type ?? "residential",
              email: customer.email ?? "",
              phone: customer.phone ?? "",
              notes: customer.notes ?? "",
              sms_consent: customer.sms_consent,
            }}
            action={async (formData) => {
              "use server";
              const email = String(formData.get("email") ?? "");
              if (await isCustomerEmailTaken(email, id)) {
                return { error: "A customer with this email address already exists." };
              }
              return updateCustomer(id, formData);
            }}
            submitLabel={t("detail.saveChanges")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.addressesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(addresses ?? []).map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {a.label}{" "}
                  {a.is_default && <Badge tone="brand">{t("detail.defaultBadge")}</Badge>}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">
                  {a.address_line1}
                  {a.address_line2 ? `, ${a.address_line2}` : ""}, {a.city},{" "}
                  {a.state} {a.zip}
                </p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await deleteAddress(a.id, id);
                }}
              >
                <Button type="submit" variant="outline">
                  {t("detail.removeAddress")}
                </Button>
              </form>
            </div>
          ))}
          <AddressForm customerId={id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.portalTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">
            {t("detail.portalDescription")}
          </p>
          <PortalLinkButton
            customerId={id}
            baseUrl={baseUrl}
            customerName={customer.name}
            customerEmail={customer.email}
            customerPhone={customer.phone}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("detail.bookingsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {(bookings ?? []).length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{t("detail.noBookings")}</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {(bookings ?? []).map((b) => (
                  <li key={b.id} className="py-2 text-sm">
                    <Link href={`/dashboard/bookings/${b.id}`} className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400">
                      {b.booking_number}
                    </Link>{" "}
                    <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">· {formatDate(b.scheduled_start)}</span>{" "}
                    <TJobStatusPill status={b.status as JobStatus} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("detail.quotesTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {(quotes ?? []).length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{t("detail.noQuotes")}</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {(quotes ?? []).map((q) => (
                  <li key={q.id} className="py-2 text-sm">
                    <Link href={`/dashboard/quotes/${q.id}`} className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400">
                      {q.quote_number}
                    </Link>{" "}
                    <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">· {formatCents(q.total_cents)}</span>{" "}
                    <TQuoteStatusPill status={q.status as QuoteStatus} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ConfirmActionButton
            label={t("detail.deleteCustomer")}
            confirmLabel={t("detail.confirmDeleteCustomer")}
            confirmMessage="Delete this customer? Their addresses will be removed too. This can't be undone."
            pendingLabel="Deleting…"
            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            action={async () => {
              "use server";
              // Surface a clear reason instead of failing silently: quotes,
              // jobs and invoices reference the customer with ON DELETE
              // RESTRICT, so the database itself would refuse the delete.
              const { company: actionCompany } = await requirePermission("customers.manage");
              const db = await createClient();
              const [b, q, j, inv] = await Promise.all([
                db.from("bookings").select("id", { count: "exact", head: true }).eq("customer_id", id).eq("company_id", actionCompany.id).neq("status", "canceled"),
                db.from("quotes").select("id", { count: "exact", head: true }).eq("customer_id", id).eq("company_id", actionCompany.id),
                db.from("jobs").select("id", { count: "exact", head: true }).eq("customer_id", id).eq("company_id", actionCompany.id),
                db.from("invoices").select("id", { count: "exact", head: true }).eq("customer_id", id).eq("company_id", actionCompany.id),
              ]);
              const activeBookings = b.count ?? 0;
              if (activeBookings > 0) {
                return {
                  error: `This customer has ${activeBookings} active booking${activeBookings === 1 ? "" : "s"}. Cancel ${activeBookings === 1 ? "it" : "them"} first, then delete.`,
                };
              }
              const history: string[] = [];
              const qc = q.count ?? 0, jc = j.count ?? 0, ic = inv.count ?? 0;
              if (qc > 0) history.push(`${qc} quote${qc === 1 ? "" : "s"}`);
              if (jc > 0) history.push(`${jc} job${jc === 1 ? "" : "s"}`);
              if (ic > 0) history.push(`${ic} invoice${ic === 1 ? "" : "s"}`);
              if (history.length > 0) {
                return {
                  error: `This customer can't be deleted because they have ${history.join(", ")} on record. Customers with history are kept for your books.`,
                };
              }
              return deleteCustomer(id);
            }}
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
            {t("detail.deleteHint")}{" "}
            Customers with quotes, jobs, or invoices on record can&apos;t be deleted.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
