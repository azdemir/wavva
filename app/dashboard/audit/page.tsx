import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const instant = false;

/** Owner-only audit log viewer. */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { company } = await requireOwner();
  const supabase = await createClient();
  const q = ((await searchParams).q ?? "").trim();
  const type = ((await searchParams).type ?? "").trim();

  let query = supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, metadata, created_at, actor_user_id")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) query = query.ilike("action", `%${q}%`);
  if (type) query = query.eq("entity_type", type);

  const { data: logs } = await query;

  // Resolve actor emails for display.
  const actorIds = [...new Set((logs ?? []).map((l) => l.actor_user_id).filter(Boolean))];
  const { data: actors } = actorIds.length
    ? await supabase.from("memberships").select("user_id, email").in("user_id", actorIds as string[])
    : { data: [] };
  const emailOf = (uid: string | null) =>
    actors?.find((a) => a.user_id === uid)?.email ?? (uid ? `${uid.slice(0, 8)}…` : "system");

  return (
    <div className="space-y-6">
      <Heading
        title="Audit log"
        description="Every important action in your workspace, newest first. Logs are append-only."
      />

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Field id="audit-q" name="q" label="Filter by action" defaultValue={q} placeholder="e.g. quote.sent" />
        </div>
        <div className="w-48">
          <Field id="audit-type" name="type" label="Entity type" defaultValue={type} placeholder="e.g. invoice" />
        </div>
        <Button type="submit" variant="outline">Filter</Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Events ({logs?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  <th className="px-5 py-3 font-medium">When</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Entity</th>
                  <th className="px-5 py-3 font-medium">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(logs ?? []).map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500 dark:text-slate-400 dark:text-slate-500">
                      {new Date(l.created_at).toLocaleString("en-US")}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone="slate">{l.action}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400 dark:text-slate-500">
                      {l.entity_type}
                      {l.entity_id ? <span className="text-slate-400 dark:text-slate-500"> · {l.entity_id.slice(0, 8)}</span> : ""}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400 dark:text-slate-500">{emailOf(l.actor_user_id)}</td>
                  </tr>
                ))}
                {(logs ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                      No events match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
