"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Field, SelectField, TextareaField } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SparkleIcon } from "@/components/ui/icons";

function RemoveButton({ onClick, label, className = "" }: { onClick: () => void; label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800 ${className}`}
    >
      <span aria-hidden="true" className="block h-4 w-4 text-center text-lg leading-4">&times;</span>
    </button>
  );
}
import { generateChecklistAction } from "@/lib/actions/checklist-studio";
import {
  createChecklistTemplate,
  deleteChecklistTemplate,
  type ChecklistTemplate,
} from "@/lib/actions/checklists";
import type { GeneratedChecklist } from "@/lib/checklists/generator";

type EditableRoom = { name: string; tasks: string[] };

function toEditable(g: GeneratedChecklist): {
  rooms: EditableRoom[];
  surprise: string[];
} {
  return {
    rooms: g.rooms.map((r) => ({ name: r.name, tasks: [...r.tasks] })),
    surprise: [...g.surpriseExtras],
  };
}

function flatten(rooms: EditableRoom[], surprise: string[]): string[] {
  const items = rooms.flatMap((r) =>
    r.tasks.map((t) => t.trim()).filter(Boolean).map((t) => `${r.name} — ${t}`),
  );
  for (const s of surprise.map((x) => x.trim()).filter(Boolean)) {
    items.push(`Surprise touch — ${s}`);
  }
  return items.slice(0, 100);
}

export function ChecklistStudio({ initial }: { initial: ChecklistTemplate[] }) {
  const t = useTranslations("checklists");
  const [templates, setTemplates] = useState(initial);

  // Generator form
  const [homeType, setHomeType] = useState("house");
  const [serviceLevel, setServiceLevel] = useState("standard");
  const [bedrooms, setBedrooms] = useState("3");
  const [bathrooms, setBathrooms] = useState("2");
  const [pets, setPets] = useState(false);
  const [kids, setKids] = useState(false);
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Editable preview
  const [rooms, setRooms] = useState<EditableRoom[] | null>(null);
  const [surprise, setSurprise] = useState<string[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    setNotice(null);
    const result = await generateChecklistAction({
      homeType,
      serviceLevel,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      pets,
      kids,
      notes,
    });
    setGenerating(false);
    if (!result.ok) {
      setGenError(t(`ai.errors.${result.error === "NOT_PERMITTED" ? "notPermitted" : result.error === "RATE_LIMITED" ? "rateLimited" : "invalid"}`));
      return;
    }
    const editable = toEditable(result.checklist);
    setRooms(editable.rooms);
    setSurprise(editable.surprise);
    setTemplateName(
      t("ai.suggestedName", {
        level:
          serviceLevel === "deep"
            ? t("ai.serviceLevels.deep")
            : serviceLevel === "move-out"
              ? t("ai.serviceLevels.moveOut")
              : t("ai.serviceLevels.standard"),
        beds: bedrooms,
        baths: bathrooms,
      }),
    );
  }

  function updateTask(ri: number, ti: number, value: string) {
    setRooms((prev) =>
      prev?.map((r, i) =>
        i === ri ? { ...r, tasks: r.tasks.map((x, j) => (j === ti ? value : x)) } : r,
      ) ?? null,
    );
  }

  function removeTask(ri: number, ti: number) {
    setRooms((prev) =>
      prev?.map((r, i) =>
        i === ri ? { ...r, tasks: r.tasks.filter((_, j) => j !== ti) } : r,
      ) ?? null,
    );
  }

  function addTask(ri: number) {
    setRooms((prev) =>
      prev?.map((r, i) => (i === ri ? { ...r, tasks: [...r.tasks, ""] } : r)) ?? null,
    );
  }

  function updateSurprise(i: number, value: string) {
    setSurprise((prev) => prev.map((x, j) => (j === i ? value : x)));
  }

  function removeSurprise(i: number) {
    setSurprise((prev) => prev.filter((_, j) => j !== i));
  }

  async function handleSave() {
    if (!rooms) return;
    const items = flatten(rooms, surprise);
    if (!templateName.trim() || items.length === 0) {
      setGenError(t("ai.errors.emptySave"));
      return;
    }
    setSaving(true);
    setGenError(null);
    const result = await createChecklistTemplate({
      name: templateName.trim(),
      items: items.map((label) => ({ label })),
    });
    setSaving(false);
    if (!result.ok) {
      setGenError(result.error ?? t("ai.errors.saveFailed"));
      return;
    }
    setNotice(t("ai.saved"));
    setRooms(null);
    setSurprise([]);
    setTemplateName("");
    // Refresh the saved list locally
    setTemplates((prev) => [
      ...prev,
      { id: result.id ?? `tmp-${Date.now()}`, name: templateName.trim(), items: items.map((label) => ({ label })) },
    ]);
  }

  async function handleDelete(id: string) {
    const result = await deleteChecklistTemplate(id);
    if (result.ok) setTemplates((prev) => prev.filter((x) => x.id !== id));
  }

  const totalTasks = (rooms?.reduce((n, r) => n + r.tasks.length, 0) ?? 0) + surprise.length;

  return (
    <div className="space-y-6">
      {notice && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          {notice}
        </p>
      )}

      {/* Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparkleIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            {t("ai.title")}
          </CardTitle>
          <CardDescription>{t("ai.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="cs-home-type"
              label={t("ai.homeType")}
              value={homeType}
              onChange={(e) => setHomeType(e.target.value)}
            >
              <option value="house">{t("ai.homeTypes.house")}</option>
              <option value="apartment">{t("ai.homeTypes.apartment")}</option>
              <option value="condo">{t("ai.homeTypes.condo")}</option>
            </SelectField>
            <SelectField
              id="cs-service-level"
              label={t("ai.serviceLevel")}
              value={serviceLevel}
              onChange={(e) => setServiceLevel(e.target.value)}
            >
              <option value="standard">{t("ai.serviceLevels.standard")}</option>
              <option value="deep">{t("ai.serviceLevels.deep")}</option>
              <option value="move-out">{t("ai.serviceLevels.moveOut")}</option>
            </SelectField>
            <Field
              id="cs-bedrooms"
              label={t("ai.bedrooms")}
              type="number"
              min={0}
              max={10}
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
            />
            <Field
              id="cs-bathrooms"
              label={t("ai.bathrooms")}
              type="number"
              min={1}
              max={10}
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-600"
                checked={pets}
                onChange={(e) => setPets(e.target.checked)}
              />
              {t("ai.pets")}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-600"
                checked={kids}
                onChange={(e) => setKids(e.target.checked)}
              />
              {t("ai.kids")}
            </label>
          </div>
          <TextareaField
            id="cs-notes"
            label={t("ai.notes")}
            placeholder={t("ai.notesPlaceholder")}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {genError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {genError}
            </p>
          )}
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? t("ai.generating") : rooms ? t("ai.regenerate") : t("ai.generate")}
          </Button>
        </CardContent>
      </Card>

      {/* Editable preview */}
      {rooms && (
        <Card>
          <CardHeader>
            <CardTitle>{t("ai.previewTitle")}</CardTitle>
            <CardDescription>
              {t("ai.previewDescription", { count: totalTasks })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-5">
              {rooms.map((room, ri) => (
                <div key={room.name}>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {room.name}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {room.tasks.map((task, ti) => (
                      <li key={ti} className="flex items-center gap-2">
                        <input
                          value={task}
                          onChange={(e) => updateTask(ri, ti, e.target.value)}
                          placeholder={t("ai.taskPlaceholder")}
                          aria-label={`${room.name} task ${ti + 1}`}
                          className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                        <RemoveButton onClick={() => removeTask(ri, ti)} label={t("ai.removeTask")} />
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => addTask(ri)}
                    className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    + {t("ai.addTask")}
                  </button>
                </div>
              ))}
            </div>

            {surprise.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                  <SparkleIcon className="h-4 w-4" />
                  {t("ai.surpriseTitle")}
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  {t("ai.surpriseHint")}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {surprise.map((s, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <input
                        value={s}
                        onChange={(e) => updateSurprise(i, e.target.value)}
                        aria-label={`${t("ai.surpriseTitle")} ${i + 1}`}
                        className="h-10 flex-1 rounded-lg border border-amber-200 bg-white px-3 text-sm text-slate-900 dark:border-amber-800 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <RemoveButton onClick={() => removeSurprise(i)} label={t("ai.removeTask")} className="text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900" />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end dark:border-slate-800">
              <div className="flex-1">
                <Field
                  id="cs-template-name"
                  label={t("ai.templateName")}
                  placeholder={t("ai.templateNamePlaceholder")}
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <Button onClick={handleSave} disabled={saving || totalTasks === 0}>
                {saving ? t("ai.saving") : t("ai.saveTemplate")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved templates */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ai.savedTitle")}</CardTitle>
          <CardDescription>{t("ai.savedDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("ai.noTemplates")}</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {templates.map((tpl) => (
                <li key={tpl.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {tpl.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("ai.itemCount", { count: tpl.items.length })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="slate">{t("ai.itemCount", { count: tpl.items.length })}</Badge>
                    <ConfirmActionButton
                      label={t("ai.deleteTemplate", { name: tpl.name })}
                      confirmMessage={t("ai.deleteConfirm", { name: tpl.name })}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
                      action={() => handleDelete(tpl.id)}
                    >
                      <span aria-hidden="true" className="block h-4 w-4 text-center text-lg leading-4">&times;</span>
                    </ConfirmActionButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
