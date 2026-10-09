import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { createInvite, deleteInvite } from "@/lib/actions/team";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, SelectField } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FilterPills } from "@/components/ui/filters";

const roleTones = { owner: "brand", manager: "accent", cleaner: "slate" } as const;
const roles = ["all", "owner", "manager", "cleaner"] as const;

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { company } = await requirePermission("team.manage");
  const t = await getTranslations("team");
  const supabase = await createClient();
  const params = await searchParams;
  const role = (roles as readonly string[]).includes(params.role ?? "")
    ? (params.role as (typeof roles)[number])
    : "all";

  let memberQuery = supabase
    .from("memberships")
    .select("id, email, role, created_at")
    .eq("company_id", company.id)
    .order("created_at", { ascending: true });
  if (role !== "all") memberQuery = memberQuery.eq("role", role);

  const [{ data: members }, { data: invites }] = await Promise.all([
    memberQuery,
    supabase
      .from("invites")
      .select("id, email, role, token, created_at")
      .eq("company_id", company.id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const h = await headers();
  const baseUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  const roleLabels = {
    owner: t("roles.owner"),
    manager: t("roles.manager"),
    cleaner: t("roles.cleaner"),
  } as const;
  const roleLabel = (role: string) =>
    roleLabels[role as keyof typeof roleLabels] ?? role;

  return (
    <div className="space-y-8">
      <Heading
        title={t("heading.title")}
        description={t("heading.description")}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("members.title", { count: members?.length ?? 0 })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <FilterPills
              basePath="/dashboard/team"
              param="role"
              options={roles.map((r) => ({
                value: r,
                label: r === "all" ? t("roles.all") : roleLabel(r),
              }))}
              current={role}
            />
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {(members ?? []).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-slate-100">{m.email}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    {t("members.joinedOn", { date: new Date(m.created_at).toLocaleDateString("en-US") })}
                  </p>
                </div>
                <Badge tone={roleTones[m.role as keyof typeof roleTones] ?? "slate"} className="shrink-0">
                  {roleLabel(m.role)}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("invite.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                "use server";
                const result = await createInvite(formData);
                if (result?.error) throw new Error(result.error);
              }}
              className="flex flex-wrap items-end gap-3"
            >
              <div className="min-w-52 flex-1">
                <Field
                  id="team-email"
                  name="email"
                  label={t("invite.emailLabel")}
                  type="email"
                  required
                  placeholder={t("invite.emailPlaceholder")}
                />
              </div>
              <div className="w-36">
                <SelectField id="team-role" name="role" label={t("invite.roleLabel")}>
                  <option value="cleaner">{t("roles.cleaner")}</option>
                  <option value="manager">{t("roles.manager")}</option>
                  <option value="owner">{t("roles.owner")}</option>
                </SelectField>
              </div>
              <Button type="submit">{t("invite.submit")}</Button>
            </form>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
              {t("invite.note")}
            </p>
          </CardContent>
        </Card>

      {(invites ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("pending.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {(invites ?? []).map((inv) => (
                <li key={inv.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {inv.email}{" "}
                      <Badge tone={roleTones[inv.role as keyof typeof roleTones] ?? "slate"}>
                        {roleLabel(inv.role)}
                      </Badge>
                    </p>
                    <code className="mt-1 block truncate rounded bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 dark:text-slate-500">
                      {baseUrl}/invite/{inv.token}
                    </code>
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await deleteInvite(inv.id);
                    }}
                  >
                    <Button type="submit" variant="outline">
                      {t("pending.revoke")}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
