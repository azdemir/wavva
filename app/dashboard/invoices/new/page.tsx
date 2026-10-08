import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { InvoiceBuilder } from "@/components/invoices/invoice-builder";

export const instant = false;

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const { company } = await requireCompany();
  const supabase = await createClient();
  const { bookingId } = await searchParams;

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .eq("company_id", company.id)
    .order("name");

  const settings = company.settings as { default_tax_rate?: number };

  let prefill;
  if (bookingId) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, booking_number, customer_id, services(name)")
      .eq("id", bookingId)
      .eq("company_id", company.id)
      .single();
    if (booking) {
      prefill = {
        customerId: booking.customer_id,
        bookingId: booking.id,
        notes: `For booking ${booking.booking_number}.`,
      };
    }
  }

  if ((customers ?? []).length === 0) {
    return (
      <div className="max-w-2xl space-y-6">
        <Heading title="New invoice" description="Bill a customer." />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">
              You need a customer first.{" "}
              <Link href="/dashboard/customers/new" className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400">
                Add a customer →
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Heading title="New invoice" description="Line items and totals — due date optional." />
      <Card>
        <CardContent className="pt-6">
          <InvoiceBuilder
            customers={customers ?? []}
            defaultTaxRate={settings.default_tax_rate ?? 0}
            prefill={prefill}
          />
        </CardContent>
      </Card>
    </div>
  );
}
