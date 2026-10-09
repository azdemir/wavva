import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/admin";
import {
  CRM_STAGES,
  crmSourceLabel,
  type CrmContact,
} from "@/lib/studio/crm";
import { listCrmContacts } from "@/lib/studio/crm-server";
import { updateCrmContact } from "@/lib/studio/actions";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { CrmSetupNotice } from "@/components/studio/crm-setup-notice";

export const instant = false;

async function moveStage(id: string, formData: FormData) {
  "use server";
  await updateCrmContact(id, { stage: String(formData.get("stage") ?? "") });
}

/**
 * Founder CRM — pipeline kanban. New trial requests and contact-form
 * messages appear here automatically; move them through stages as you
 * work them.
 */
export default async function CrmPage() {
  await requirePlatformAdmin();
  const contacts = await listCrmContacts();
  const byStage = new Map<string, CrmContact[]>();
  for (const s of CRM_STAGES) byStage.set(s.id, []);
  for (const c of contacts) {
    const list = byStage.get(c.stage) ?? byStage.get("new")!;
    list.push(c);
  }

  return (
    <div className="space-y-6">
      <CrmSetupNotice />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading
          title="CRM"
          description={`${contacts.length} lead${contacts.length === 1 ? "" : "s"} in the pipeline. Trial requests and contact messages land here on their own.`}
        />
        <Button href="/studio/crm/new">+ New lead</Button>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              No leads yet
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              When someone requests a trial or sends a contact message, they
              show up here automatically. Or add your first lead manually.
            </p>
            <Button href="/studio/crm/new" className="mt-4">
              + New lead
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-5">
          {CRM_STAGES.map((stage) => {
            const list = byStage.get(stage.id) ?? [];
            return (
              <section
                key={stage.id}
                aria-label={stage.label}
                className="rounded-xl bg-slate-200/60 p-3 dark:bg-slate-800/60"
              >
                <header className="flex items-baseline justify-between px-1 pb-3">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {stage.label}
                  </h2>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {list.length}
                  </span>
                </header>
                <div className="space-y-3">
                  {list.map((c) => (
                    <Card key={c.id} className="shadow-none">
                      <CardContent className="p-4">
                        <Link
                          href={`/studio/crm/${c.id}`}
                          className="block text-sm font-semibold text-slate-900 hover:underline dark:text-slate-100"
                        >
                          {c.name}
                        </Link>
                        {c.company_name && (
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                            {c.company_name}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge tone="slate">{crmSourceLabel(c.source)}</Badge>
                          {(c.activity_count ?? 0) > 0 && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {c.activity_count} note
                              {c.activity_count === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                          {c.last_activity_at
                            ? `Active ${formatDate(c.last_activity_at)}`
                            : `Added ${formatDate(c.created_at)}`}
                        </p>
                        <form
                          action={moveStage.bind(null, c.id)}
                          className="mt-3 flex gap-1.5"
                        >
                          <select
                            name="stage"
                            defaultValue={c.stage}
                            aria-label={`Move ${c.name} to stage`}
                            className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          >
                            {CRM_STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="h-9 shrink-0 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900"
                          >
                            Move
                          </button>
                        </form>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
