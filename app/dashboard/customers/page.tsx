import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { FilterPills, FilterSearch, ExportButton } from "@/components/ui/filters";
import { parsePageParam, PAGE_SIZE } from "@/lib/pagination";
import { PlusIcon, UsersIcon } from "@/components/ui/icons";
import { missingColumnName } from "@/lib/supabase/schema-fallback";

// Authenticated customer data is loaded per request, not during prefetching.
export const instant = false;

const types = ["all", "residential", "commercial"] as const;
const typeTones = { residential: "slate", commercial: "brand" } as const;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const { company } = await requirePermission("customers.manage");
  const supabase = await createClient();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const type = (types as readonly string[]).includes(params.type ?? "")
    ? (params.type as (typeof types)[number])
    : "all";
  const page = parsePageParam(params.page);
  const t = await getTranslations("customers");

  // Fetch the list; if the DB is behind on migration 0008 (no customer_type
  // column), retry without the new column instead of failing the page.
  const fetchPage = (withType: boolean) => {
    let query = supabase
      .from("customers")
      .select(
        withType
          ? "id, name, customer_type, email, phone, created_at"
          : "id, name, email, phone, created_at",
        { count: "exact" }
      )
      .eq("company_id", company.id)
      .order("name", { ascending: true });
    if (withType && type !== "all") query = query.eq("customer_type", type);
    if (q) {
      const like = `%${q.replace(/[%_]/g, "")}%`;
      query = query.or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like}`);
    }
    return query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  };

  let { data: customersRaw, count, error } = await fetchPage(true);
  let schemaStale = false;
  if (error && missingColumnName(error) === "customer_type") {
    schemaStale = true;
    ({ data: customersRaw, count } = await fetchPage(false));
  }
  // The conditional select widens the inferred row type; the runtime shape
  // is the same in both branches.
  type CustomerListRow = {
    id: string;
    name: string;
    customer_type?: string | null;
    email: string | null;
    phone: string | null;
    created_at: string;
  };
  const customers = customersRaw as unknown as CustomerListRow[] | null;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtering = type !== "all" || q !== "";
  const keep = { q: q || undefined, type: type !== "all" ? type : undefined };
  const exportQs = new URLSearchParams(
    Object.entries(keep).filter(([, v]) => v !== undefined) as [string, string][],
  ).toString();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading title={t("list.title")} description={t("list.description")} />
        <div className="flex flex-wrap gap-2">
          <ExportButton href={`/api/exports/customers${exportQs ? `?${exportQs}` : ""}`} />
          <Button href="/dashboard/customers/new">
            <PlusIcon className="h-4 w-4" /> {t("list.newCustomer")}
          </Button>
        </div>
      </div>

      {schemaStale && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          <span className="font-semibold">{t("setup.title")}</span>{" "}
          {t.rich("setup.body", {
            path: (chunks) => (
              <code className="rounded bg-amber-100 px-1 font-mono text-[13px] dark:bg-amber-900">
                {chunks}
              </code>
            ),
          })}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        {!schemaStale && (
          <FilterPills
            basePath="/dashboard/customers"
            param="type"
            options={types.map((typeValue) => ({
              value: typeValue,
              label: t(`list.typePills.${typeValue}`),
            }))}
            current={type}
            preserve={{ q: q || undefined }}
          />
        )}
        <FilterSearch
          id="cust-search"
          label={t("list.searchLabel")}
          defaultValue={q}
          placeholder={t("list.searchPlaceholder")}
          preserve={{ type: type !== "all" ? type : undefined }}
        />
      </div>

      {(customers ?? []).length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title={filtering ? t("list.emptyFilteredTitle") : t("list.emptyTitle")}
              description={
                filtering
                  ? t("list.emptyFilteredDescription")
                  : t("list.emptyDescription")
              }
              action={
                filtering ? undefined : (
                  <Button href="/dashboard/customers/new">{t("list.newCustomer")}</Button>
                )
              }
              icon={<UsersIcon className="h-10 w-10" />}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {(customers ?? []).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/customers/${c.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate font-medium text-slate-900 dark:text-slate-100">
                        <span className="truncate">{c.name}</span>
                        <Badge tone={typeTones[(c.customer_type as keyof typeof typeTones) ?? "residential"] ?? "slate"} className="shrink-0">
                          {(c.customer_type as string) === "commercial" ? t("list.badgeCommercial") : t("list.badgeResidential")}
                        </Badge>
                      </p>
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                        {[c.email, c.phone].filter(Boolean).join(" · ") || t("list.noContactInfo")}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-slate-400 dark:text-slate-500" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
          <div className="px-5 pb-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              basePath="/dashboard/customers"
              searchParams={keep}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
