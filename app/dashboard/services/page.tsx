import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ServiceManager, AddonManager } from "@/components/services/catalog";

export default async function ServicesPage() {
  const { company } = await requireCompany();
  const supabase = await createClient();

  const [{ data: services }, { data: addons }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, category, description, base_price_cents, unit, is_active")
      .eq("company_id", company.id)
      .order("name", { ascending: true }),
    supabase
      .from("addons")
      .select("id, name, price_cents, is_active")
      .eq("company_id", company.id)
      .order("name", { ascending: true }),
  ]);

  return (
    <div className="max-w-4xl space-y-8">
      <Heading
        title="Services & pricing"
        description="The catalog your quotes and bookings are built from."
      />

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>
            Deactivate instead of deleting anything that appears on past quotes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceManager initial={(services ?? []) as never} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add-ons</CardTitle>
          <CardDescription>
            Optional extras customers can add to any quote, like inside-fridge
            or laundry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddonManager initial={(addons ?? []) as never} />
        </CardContent>
      </Card>
    </div>
  );
}
