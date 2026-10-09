import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { BookingForm, type BookingPrefill } from "@/components/bookings/booking-form";
import { formatCents } from "@/lib/format";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ quoteId?: string }>;
}) {
  const { company } = await requirePermission("bookings.manage");
  const t = await getTranslations("bookings");
  const supabase = await createClient();
  const { quoteId } = await searchParams;

  const [{ data: customers }, { data: services }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, service_addresses(id, label, address_line1, city, state, is_default)")
      .eq("company_id", company.id)
      .order("name"),
    supabase
      .from("services")
      .select("id, name")
      .eq("company_id", company.id)
      .eq("is_active", true)
      .order("name"),
  ]);

  let prefill: BookingPrefill | undefined;
  if (quoteId) {
    const { data: quote } = await supabase
      .from("quotes")
      .select("id, quote_number, customer_id, total_cents, quote_line_items(kind, ref_id)")
      .eq("id", quoteId)
      .eq("company_id", company.id)
      .single();
    if (quote) {
      const firstService = (quote.quote_line_items as { kind: string; ref_id: string | null }[]).find(
        (li) => li.kind === "service" && li.ref_id,
      );
      const cust = (customers ?? []).find((c) => c.id === quote.customer_id);
      const addrs = (cust?.service_addresses ?? []) as { id: string; is_default: boolean }[];
      prefill = {
        quoteId: quote.id,
        customerId: quote.customer_id,
        addressId: addrs.find((a) => a.is_default)?.id ?? addrs[0]?.id,
        serviceId: firstService?.ref_id ?? undefined,
        notes: t("new.prefillNotes", { number: quote.quote_number, total: formatCents(quote.total_cents) }),
      };
    }
  }

  if ((customers ?? []).length === 0) {    return (
      <div className="max-w-2xl space-y-6">
        <Heading title={t("new.title")} description={t("new.description")} />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">
              {t("new.needCustomer")}{" "}
              <Link href="/dashboard/customers/new" className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400">
                {t("new.addCustomer")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // BookingForm expects `addresses`; the query nests them as `service_addresses`.
  const formCustomers = (customers ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    addresses: ((c.service_addresses ?? []) as {
      id: string;
      label: string;
      address_line1: string;
      city: string;
      state: string;
      is_default: boolean;
    }[]).map((a) => ({
      id: a.id,
      label: a.label,
      address_line1: a.address_line1,
      city: a.city,
      state: a.state,
      is_default: a.is_default,
    })),
  }));

  return (
    <div className="max-w-3xl space-y-6">
      <Heading
        title={t("new.title")}
        description={
          prefill?.quoteId
            ? t("new.descriptionPrefill")
            : t("new.descriptionDefault")
        }
      />
      <Card>
        <CardContent className="pt-6">
          <BookingForm
            customers={formCustomers}
            services={services ?? []}
            prefill={prefill}
          />
        </CardContent>
      </Card>
    </div>
  );
}
