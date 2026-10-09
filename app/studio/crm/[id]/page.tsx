import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/admin";
import {
  CRM_STAGES,
  CRM_SOURCES,
  CRM_ACTIVITY_KINDS,
  crmStageLabel,
  crmSourceLabel,
} from "@/lib/studio/crm";
import { getCrmContact } from "@/lib/studio/crm-server";
import {
  updateCrmContact,
  deleteCrmContact,
  addCrmActivity,
} from "@/lib/studio/actions";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/input";
import { formatCents, formatDateTime } from "@/lib/format";

export const instant = false;

const ACTIVITY_TONE: Record<string, "brand" | "accent" | "amber" | "slate"> = {
  note: "slate",
  call: "brand",
  email: "accent",
  meeting: "amber",
  stage_change: "slate",
};

function activityLabel(kind: string): string {
  if (kind === "stage_change") return "Stage";
  return (
    CRM_ACTIVITY_KINDS.find((k) => k.id === kind)?.label ?? kind
  );
}

export default async function CrmContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAdmin();
  const { id } = await params;
  const result = await getCrmContact(id);
  if (!result) notFound();
  const { contact, activities } = result;

  async function saveDetails(formData: FormData) {
    "use server";
    const dollars = String(formData.get("deal_value") ?? "").trim();
    await updateCrmContact(id, {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      company_name: String(formData.get("company_name") ?? ""),
      source: String(formData.get("source") ?? "manual"),
      deal_value_cents: dollars === "" ? null : Math.round(Number(dollars) * 100),
      notes: String(formData.get("notes") ?? ""),
    });
  }

  async function changeStage(formData: FormData) {
    "use server";
    await updateCrmContact(id, { stage: String(formData.get("stage") ?? "") });
  }

  async function remove() {
    "use server";
    const res = await deleteCrmContact(id);
    if (res.ok) redirect("/studio/crm");
  }

  async function logActivity(formData: FormData) {
    "use server";
    await addCrmActivity(id, {
      kind: String(formData.get("kind") ?? "note"),
      body: String(formData.get("body") ?? ""),
    });
  }

  return (
    <div className="space-y-6">
      <Link
        href="/studio/crm"
        className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        ← Back to CRM
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading
          title={contact.name}
          description={
            [contact.company_name, contact.email].filter(Boolean).join(" · ") ||
            "Lead details"
          }
        />
        <Badge tone={contact.stage === "lost" ? "slate" : "brand"}>
          {crmStageLabel(contact.stage)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={saveDetails} className="space-y-4">
                <Field
                  id="crm-name"
                  name="name"
                  label="Name"
                  defaultValue={contact.name}
                  required
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="crm-email"
                    name="email"
                    label="Email"
                    type="email"
                    defaultValue={contact.email ?? ""}
                  />
                  <Field
                    id="crm-phone"
                    name="phone"
                    label="Phone"
                    type="tel"
                    defaultValue={contact.phone ?? ""}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="crm-company"
                    name="company_name"
                    label="Company"
                    defaultValue={contact.company_name ?? ""}
                  />
                  <Field
                    id="crm-deal"
                    name="deal_value"
                    label="Deal value (USD)"
                    type="number"
                    min={0}
                    step="1"
                    defaultValue={
                      contact.deal_value_cents != null
                        ? String(contact.deal_value_cents / 100)
                        : ""
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="crm-source"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Source
                  </label>
                  <select
                    id="crm-source"
                    name="source"
                    defaultValue={contact.source}
                    className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {CRM_SOURCES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="crm-notes"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Notes
                  </label>
                  <textarea
                    id="crm-notes"
                    name="notes"
                    rows={3}
                    defaultValue={contact.notes ?? ""}
                    className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Save details
                </button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Move stage</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={changeStage} className="flex gap-2">
                <select
                  name="stage"
                  defaultValue={contact.stage}
                  aria-label="Pipeline stage"
                  className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {CRM_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} — {s.hint}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="h-11 shrink-0 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900"
                >
                  Move
                </button>
              </form>
              <form action={remove} className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center rounded-lg border border-red-300 px-4 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                >
                  Delete this lead
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={logActivity} className="space-y-3">
              <div className="flex gap-2">
                <select
                  name="kind"
                  defaultValue="note"
                  aria-label="Activity type"
                  className="h-11 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {CRM_ACTIVITY_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="h-11 shrink-0 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Log
                </button>
              </div>
              <textarea
                name="body"
                rows={3}
                required
                placeholder="What happened? Next steps?"
                aria-label="Activity details"
                className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </form>

            <ul className="mt-6 space-y-4">
              {activities.length === 0 && (
                <li className="text-sm text-slate-500 dark:text-slate-400">
                  Nothing logged yet — add the first note above.
                </li>
              )}
              {activities.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <Badge tone={ACTIVITY_TONE[a.kind] ?? "slate"} className="h-fit shrink-0">
                    {activityLabel(a.kind)}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                      {a.body}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {formatDateTime(a.created_at)}
                      {a.created_by_email ? ` · ${a.created_by_email}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {contact.deal_value_cents != null && (
              <p className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Deal value:{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCents(contact.deal_value_cents)}
                </span>
              </p>
            )}
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Source: {crmSourceLabel(contact.source)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
