import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { QuoteBuilder } from "@/components/quotes/quote-builder";

export default async function NewQuotePage() {
  const { company } = await requireCompany();
  const supabase = await createClient();

  const [{ data: customers }, { data: services }, { data: addons }] = await Promise.all([
    supabase.from("customers").select("id, name").eq("company_id", company.id).order("name"),
    supabase.from("services").select("id, name, base_price_cents").eq("company_id", company.id).eq("is_active", true).order("name"),
    supabase.from("addons").select("id, name, price_cents").eq("company_id", company.id).eq("is_active", true).order("name"),
  ]);

  const settings = company.settings as { default_tax_rate?: number };

  if ((customers ?? []).length === 0) {
    return (
      <div className="max-w-2xl space-y-6">
        <Heading title="New quote" description="Build a quote for a customer." />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">
              You need a customer first.{" "}
              <Link href="/dashboard/customers/new" className="font-semibold text-brand-600 hover:text-brand-700">
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
      <Heading title="New quote" description="Line items, discount, and tax — totals update live." />
      <Card>
        <CardContent className="pt-6">
          <QuoteBuilder
            customers={customers ?? []}
            services={services ?? []}
            addons={addons ?? []}
            defaultTaxRate={settings.default_tax_rate ?? 0}
          />
        </CardContent>
      </Card>
    </div>
  );
}
