import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateCustomer, deleteCustomer, deleteAddress } from "@/lib/actions/customers";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const { company } = await requireCompany();
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
      <Heading title={customer.name} description="Customer profile and history." />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm
            initial={{
              name: customer.name,
              email: customer.email ?? "",
              phone: customer.phone ?? "",
              notes: customer.notes ?? "",
              sms_consent: customer.sms_consent,
            }}
            action={async (formData) => {
              "use server";
              return updateCustomer(id, formData);
            }}
            submitLabel="Save changes"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service addresses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(addresses ?? []).map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-4">
              <div>
                <p className="font-medium text-slate-900">
                  {a.label}{" "}
                  {a.is_default && <Badge tone="brand">Default</Badge>}
                </p>
                <p className="text-sm text-slate-600">
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
                  Remove
                </Button>
              </form>
            </div>
          ))}
          <AddressForm customerId={id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer portal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-600">
            Share a private link so this customer can approve quotes, see
            upcoming visits, and pay invoices — no login needed.
          </p>
          <PortalLinkButton customerId={id} baseUrl={baseUrl} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {(bookings ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No bookings yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {(bookings ?? []).map((b) => (
                  <li key={b.id} className="py-2 text-sm">
                    <Link href={`/dashboard/bookings/${b.id}`} className="font-medium text-brand-600 hover:text-brand-700">
                      {b.booking_number}
                    </Link>{" "}
                    <span className="text-slate-500">· {formatDate(b.scheduled_start)}</span>{" "}
                    <Badge tone="slate">{b.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            {(quotes ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No quotes yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {(quotes ?? []).map((q) => (
                  <li key={q.id} className="py-2 text-sm">
                    <Link href={`/dashboard/quotes/${q.id}`} className="font-medium text-brand-600 hover:text-brand-700">
                      {q.quote_number}
                    </Link>{" "}
                    <span className="text-slate-500">· {formatCents(q.total_cents)}</span>{" "}
                    <Badge tone="slate">{q.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form
            action={async () => {
              "use server";
              await deleteCustomer(id);
            }}
          >
            <Button type="submit" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
              Delete customer
            </Button>
            <p className="mt-2 text-xs text-slate-500">
              Only possible when the customer has no active bookings. Addresses
              are removed with the customer.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
