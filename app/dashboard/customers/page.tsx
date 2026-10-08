import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon, UsersIcon } from "@/components/ui/icons";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { company } = await requireCompany();
  const supabase = await createClient();
  const q = ((await searchParams).q ?? "").trim();

  let query = supabase
    .from("customers")
    .select("id, name, email, phone, created_at")
    .eq("company_id", company.id)
    .order("name", { ascending: true });
  if (q) query = query.ilike("name", `%${q}%`);

  const { data: customers } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading title="Customers" description="Everyone your business cleans for." />
        <Button href="/dashboard/customers/new">
          <PlusIcon className="h-4 w-4" /> New customer
        </Button>
      </div>

      <form method="get" className="max-w-sm">
        <Field
          id="cust-search"
          name="q"
          label="Search customers"
          defaultValue={q}
          placeholder="Search by name…"
        />
      </form>

      {(customers ?? []).length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title={q ? "No customers match" : "No customers yet"}
              description={
                q
                  ? "Try a different search."
                  : "Add your first customer to start quoting and booking."
              }
              action={
                q ? undefined : (
                  <Button href="/dashboard/customers/new">New customer</Button>
                )
              }
              icon={<UsersIcon className="h-10 w-10" />}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100">
              {(customers ?? []).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/customers/${c.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{c.name}</p>
                      <p className="truncate text-sm text-slate-500">
                        {[c.email, c.phone].filter(Boolean).join(" · ") || "No contact info"}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-slate-400" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
