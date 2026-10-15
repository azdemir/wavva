"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Field } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  createChecklistTemplate,
  updateChecklistTemplate,
  deleteChecklistTemplate,
  type ChecklistTemplate,
} from "@/lib/actions/checklists";

/** Owner-facing CRUD for reusable digital checklist templates. */
export function ChecklistTemplateManager({
  initial,
}: {
  initial: ChecklistTemplate[];
}) {
  const t = useTranslations("checklists");
  const [templates, setTemplates] = useState<ChecklistTemplate[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null); // null = creating
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [items, setItems] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function openNew() {
    setEditingId(null);
    setName("");
    setItems([""]);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(template: ChecklistTemplate) {
    setEditingId(template.id);
    setName(template.name);
    setItems(template.items.length > 0 ? template.items.map((i) => i.label) : [""]);
    setError(null);
    setFormOpen(true);
  }

  function setItem(i: number, value: string) {
    setItems((prev) => prev.map((v, j) => (j === i ? value : v)));
  }

  async function submit() {
    const labels = items.map((s) => s.trim()).filter(Boolean);
    if (!name.trim() || labels.length === 0) return;
    setPending(true);
    setError(null);
    const payload = { name: name.trim(), items: labels.map((label) => ({ label })) };
    const result = editingId
      ? await updateChecklistTemplate(editingId, payload)
      : await createChecklistTemplate(payload);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    // Refresh from the server so ids stay authoritative.
    const { listChecklistTemplates } = await import("@/lib/actions/checklists");
    setTemplates(await listChecklistTemplates());
    setNotice(editingId ? t("updated") : t("created"));
    setFormOpen(false);
  }

  async function remove(id: string) {
    const result = await deleteChecklistTemplate(id);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setTemplates((prev) => prev.filter((x) => x.id !== id));
    setNotice(t("deleted"));
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div role="status" className="rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800 dark:border-accent-800 dark:bg-accent-950 dark:text-accent-200">
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {templates.length === 0 && !formOpen && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">{t("noTemplates")}</p>
          </CardContent>
        </Card>
      )}

      <ul className="space-y-3">
        {templates.map((tpl) => (
          <li key={tpl.id}>
            <Card>
              <CardContent className="flex items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{tpl.name}</p>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {t("itemCount", { count: tpl.items.length })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(tpl)}>
                    {t("editTemplate")}
                  </Button>
                  <ConfirmActionButton
                    label={t("delete")}
                    confirmMessage={t("deleteConfirm")}
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                    action={() => remove(tpl.id)}
                  />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {!formOpen && (
        <Button onClick={openNew}>{t("newTemplate")}</Button>
      )}

      {formOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? t("editTemplate") : t("newTemplate")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              id="tpl-name"
              label={t("templateName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("templateNamePlaceholder")}
            />
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("itemsLabel")}</p>
              {items.map((value, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex-1">
                    <Field
                      id={`tpl-item-${i}`}
                      label=""
                      value={value}
                      onChange={(e) => setItem(i, e.target.value)}
                      placeholder={t("itemPlaceholder")}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-0.5 shrink-0"
                    onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                    disabled={items.length === 1}
                    aria-label={t("removeItem")}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, ""])}>
                {t("addItem")}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={submit} disabled={pending || !name.trim() || items.every((s) => !s.trim())}>
                {pending ? t("save") + "…" : t("save")}
              </Button>
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                {t("cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
