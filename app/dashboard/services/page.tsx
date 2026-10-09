import { requirePermission } from "@/lib/permissions";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ServiceManager, AddonManager } from "@/components/services/catalog";

export default async function ServicesPage() {
  const { company } = await requirePermission("services.manage");
  const t = await getTranslations("services");
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
        title={t("heading.title")}
        description={t("heading.description")}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("servicesCard.title")}</CardTitle>
          <CardDescription>
            {t("servicesCard.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceManager initial={(services ?? []) as never} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("addonsCard.title")}</CardTitle>
          <CardDescription>
            {t("addonsCard.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddonManager initial={(addons ?? []) as never} />
        </CardContent>
      </Card>
    </div>
  );
}
