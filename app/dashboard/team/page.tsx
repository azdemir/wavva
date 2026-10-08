import { headers } from "next/headers";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createInvite, deleteInvite } from "@/lib/actions/team";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, SelectField } from "@/components/ui/input";
import { Badge, statusLabel } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const roleTones = { owner: "brand", manager: "accent", cleaner: "slate" } as const;

export default async function TeamPage() {
  const { membership, company } = await requireCompany();
  const supabase = await createClient();
  const isOwner = membership.role === "owner";

  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase
      .from("memberships")
      .select("id, email, role, created_at")
      .eq("company_id", company.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("invites")
      .select("id, email, role, token, created_at")
      .eq("company_id", company.id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const h = await headers();
  const baseUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  return (
    <div className="space-y-8">
      <Heading
        title="Team"
        description="Everyone who can access your company's workspace."
      />

      <Card>
        <CardHeader>
          <CardTitle>Members ({members?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-slate-100">
            {(members ?? []).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{m.email}</p>
                  <p className="text-sm text-slate-500">
                    Joined {new Date(m.created_at).toLocaleDateString("en-US")}
                  </p>
                </div>
                <Badge tone={roleTones[m.role as keyof typeof roleTones] ?? "slate"} className="shrink-0">
                  {statusLabel(m.role)}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Invite a teammate</CardTitle>
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
                  label="Email"
                  type="email"
                  required
                  placeholder="teammate@example.com"
                />
              </div>
              <div className="w-36">
                <SelectField id="team-role" name="role" label="Role">
                  <option value="cleaner">Cleaner</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </SelectField>
              </div>
              <Button type="submit">Send invite</Button>
            </form>
            <p className="mt-3 text-xs text-slate-500">
              Email delivery arrives in a later stage — for now, share the
              invite link below directly.
            </p>
          </CardContent>
        </Card>
      )}

      {(invites ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending invites</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100">
              {(invites ?? []).map((inv) => (
                <li key={inv.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">
                      {inv.email}{" "}
                      <Badge tone={roleTones[inv.role as keyof typeof roleTones] ?? "slate"}>
                        {statusLabel(inv.role)}
                      </Badge>
                    </p>
                    <code className="mt-1 block truncate rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {baseUrl}/invite/{inv.token}
                    </code>
                  </div>
                  {isOwner && (
                    <form
                      action={async () => {
                        "use server";
                        await deleteInvite(inv.id);
                      }}
                    >
                      <Button type="submit" variant="outline">
                        Revoke
                      </Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {!isOwner && (
        <EmptyState
          title="Only owners can invite"
          description="Ask your company owner to invite new teammates."
        />
      )}
    </div>
  );
}
