import { Suspense } from "react";
import { requirePermission } from "@/lib/permissions";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ServiceManager, AddonManager } from "@/components/services/catalog";

export default async function ServicesPage() {
  const { company } = await requirePermission("services.manage");
  const t = await getTranslations("services");

  return (
    <div className="max-w-4xl space-y-8">
      <Heading
        title={t("heading.title")}
        description={t("heading.description")}
      />

      <Suspense fallback={<CatalogSkeleton label={t("loading.catalog")} />}>
        <ServicesCatalog companyId={company.id} />
      </Suspense>
    </div>
  );
}

/**
 * The catalog reads are intentionally uncached — the managers mutate the
 * rows in place and server actions revalidate this path. Streaming them
 * behind a Suspense boundary keeps the navigation into this page instant
 * instead of blocking on the two Supabase queries.
 */
async function ServicesCatalog({ companyId }: { companyId: string }) {
  const t = await getTranslations("services");
  const supabase = await createClient();

  const [{ data: services }, { data: addons }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, category, description, base_price_cents, unit, is_active")
      .eq("company_id", companyId)
      .order("name", { ascending: true }),
    supabase
      .from("addons")
      .select("id, name, price_cents, is_active")
      .eq("company_id", companyId)
      .order("name", { ascending: true }),
  ]);

  return (
    <>
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
    </>
  );
}

function CatalogSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-8" role="status">
      <span className="sr-only">{label}</span>
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden="true"
          className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
          <div className="mt-6 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
