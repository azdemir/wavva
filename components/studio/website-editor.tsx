"use client";

import { useMemo, useState } from "react";
import {
  CONTENT_REGISTRY,
  STUDIO_PAGES,
  type ContentDef,
  type FieldDef,
  type ListItemField,
  type StudioPageId,
} from "@/lib/studio/registry";
import { saveSiteContent, resetSiteContent } from "@/lib/studio/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PAGE_ROUTES: Record<StudioPageId, string> = {
  global: "/",
  home: "/",
  features: "/features",
  pricing: "/pricing",
  faq: "/faq",
  contact: "/contact",
  demo: "/demo",
};

const inputCls =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

/** Deep-ish clone for plain JSON values. */
function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

// ---------------------------------------------------------------------------
// Leaf editors
// ---------------------------------------------------------------------------

function TextEditor({
  value,
  onChange,
  multiline,
  rows,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  if (multiline) {
    return (
      <textarea
        className={`${inputCls} min-h-11`}
        rows={rows ?? 3}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      type="text"
      className={`${inputCls} h-11`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function ToggleEditor({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
        value ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          value ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SelectEditor({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      className={`${inputCls} h-11`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** string[] / lines — one item per row with add/remove/reorder. */
function StringListEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const setItem = (i: number, v: string) =>
    onChange(value.map((x, j) => (j === i ? v : x)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            className={`${inputCls} h-11 min-w-0 flex-1`}
            value={item}
            onChange={(e) => setItem(i, e.target.value)}
            aria-label={`Item ${i + 1}`}
          />
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label={`Move item ${i + 1} up`}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-slate-500 disabled:opacity-30 dark:border-slate-700"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === value.length - 1}
              aria-label={`Move item ${i + 1} down`}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-slate-500 disabled:opacity-30 dark:border-slate-700"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              aria-label={`Remove item ${i + 1}`}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-red-600 disabled:opacity-30 dark:border-slate-700"
            >
              ×
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, ""])}
        className="inline-flex h-11 items-center rounded-lg border border-dashed border-slate-300 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        + Add item
      </button>
    </div>
  );
}

/** list of objects — cards with per-field editors. */
function ObjectListEditor({
  def,
  value,
  onChange,
}: {
  def: Extract<FieldDef, { kind: "list" }>;
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
}) {
  const blank = () =>
    Object.fromEntries(
      def.item.map((f) => [f.key, f.kind === "select" ? f.options[0]?.value ?? "" : ""]),
    );

  const setField = (i: number, key: string, v: unknown) =>
    onChange(value.map((obj, j) => (j === i ? { ...obj, [key]: v } : obj)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.map((obj, i) => (
        <div
          key={i}
          className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Item {i + 1}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move item ${i + 1} up`}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 disabled:opacity-30 dark:border-slate-600 dark:bg-slate-900"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                aria-label={`Move item ${i + 1} down`}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 disabled:opacity-30 dark:border-slate-600 dark:bg-slate-900"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label={`Remove item ${i + 1}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-red-600 dark:border-slate-600 dark:bg-slate-900"
              >
                ×
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {def.item.map((f) => (
              <ItemField
                key={f.key}
                field={f}
                value={obj[f.key]}
                onChange={(v) => setField(i, f.key, v)}
              />
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, blank()])}
        className="inline-flex h-11 items-center rounded-lg border border-dashed border-slate-300 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        + Add item
      </button>
    </div>
  );
}

function ItemField({
  field,
  value,
  onChange,
}: {
  field: ListItemField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const str = typeof value === "string" ? value : "";
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
        {field.label}
      </label>
      {field.kind === "select" ? (
        <SelectEditor value={str} onChange={onChange} options={field.options} />
      ) : field.kind === "lines" ? (
        <TextEditor
          multiline
          rows={field.rows ?? 3}
          value={Array.isArray(value) ? (value as string[]).join("\n") : str}
          onChange={(v) =>
            onChange(
              v
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean),
            )
          }
          placeholder="One per line"
        />
      ) : (
        <TextEditor
          multiline={field.kind === "textarea"}
          rows={field.kind === "textarea" ? field.rows : undefined}
          value={str}
          onChange={onChange}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// One editable key
// ---------------------------------------------------------------------------

function ContentField({
  def,
  value,
  overridden,
  onChange,
  onSave,
  onReset,
  saving,
  feedback,
}: {
  def: ContentDef;
  value: unknown;
  overridden: boolean;
  onChange: (v: unknown) => void;
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
  feedback: { ok: boolean; message: string } | null;
}) {
  const field = def.field;
  return (
    <div className="border-t border-slate-100 py-5 first:border-t-0 first:pt-0 last:pb-0 dark:border-slate-800">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {def.label}
            {overridden && (
              <Badge tone="brand" className="ml-2">
                Customized
              </Badge>
            )}
          </p>
          {def.help && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {def.help}
            </p>
          )}
        </div>
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {def.key}
        </code>
      </div>

      {field.kind === "text" && (
        <TextEditor value={(value as string) ?? ""} onChange={onChange} />
      )}
      {field.kind === "textarea" && (
        <TextEditor
          multiline
          rows={field.rows}
          value={(value as string) ?? ""}
          onChange={onChange}
        />
      )}
      {field.kind === "lines" && (
        <TextEditor
          multiline
          rows={field.rows}
          value={((value as string[]) ?? []).join("\n")}
          onChange={(v) =>
            onChange(
              v
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean),
            )
          }
          placeholder="One per line"
        />
      )}
      {field.kind === "toggle" && (
        <ToggleEditor
          value={value === true}
          onChange={onChange}
          label={def.label}
        />
      )}
      {field.kind === "number" && (
        <input
          type="number"
          className={`${inputCls} h-11 max-w-48`}
          value={typeof value === "number" ? value : ""}
          min={field.min}
          max={field.max}
          onChange={(e) => onChange(e.target.valueAsNumber)}
        />
      )}
      {field.kind === "select" && (
        <SelectEditor
          value={(value as string) ?? ""}
          onChange={onChange}
          options={field.options}
        />
      )}
      {field.kind === "string-list" && (
        <StringListEditor
          value={((value as string[]) ?? []).map(String)}
          onChange={onChange}
        />
      )}
      {field.kind === "list" && (
        <ObjectListEditor
          def={field}
          value={((value as Record<string, unknown>[]) ?? []).map((o) => ({ ...o }))}
          onChange={onChange}
        />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save & publish"}
        </button>
        {overridden && (
          <button
            type="button"
            onClick={onReset}
            disabled={saving}
            className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Reset to default
          </button>
        )}
        {feedback && (
          <span
            role={feedback.ok ? "status" : "alert"}
            className={`text-sm font-medium ${
              feedback.ok
                ? "text-green-700 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {feedback.message}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editor shell
// ---------------------------------------------------------------------------

export function WebsiteEditor({
  initialOverrides,
}: {
  initialOverrides: Record<string, unknown>;
}) {
  const [page, setPage] = useState<StudioPageId>("home");
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(
      CONTENT_REGISTRY.map((d) => [
        d.key,
        d.key in initialOverrides ? clone(initialOverrides[d.key]) : clone(d.default),
      ]),
    ),
  );
  const [overrides, setOverrides] =
    useState<Record<string, unknown>>(initialOverrides);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<
    Record<string, { ok: boolean; message: string } | null>
  >({});

  const sections = useMemo(() => {
    const defs = CONTENT_REGISTRY.filter((d) => d.page === page);
    const groups = new Map<string, ContentDef[]>();
    for (const d of defs) {
      const list = groups.get(d.section) ?? [];
      list.push(d);
      groups.set(d.section, list);
    }
    return [...groups.entries()];
  }, [page]);

  const handleSave = async (def: ContentDef) => {
    setSaving((s) => ({ ...s, [def.key]: true }));
    setFeedback((f) => ({ ...f, [def.key]: null }));
    const res = await saveSiteContent(def.key, values[def.key]);
    setSaving((s) => ({ ...s, [def.key]: false }));
    if (res.ok) {
      setOverrides((o) => ({ ...o, [def.key]: clone(values[def.key]) }));
      setFeedback((f) => ({
        ...f,
        [def.key]: { ok: true, message: "Live on the site ✓" },
      }));
    } else {
      setFeedback((f) => ({
        ...f,
        [def.key]: { ok: false, message: res.error ?? "Couldn't save." },
      }));
    }
  };

  const handleReset = async (def: ContentDef) => {
    setSaving((s) => ({ ...s, [def.key]: true }));
    const res = await resetSiteContent(def.key);
    setSaving((s) => ({ ...s, [def.key]: false }));
    if (res.ok) {
      setValues((v) => ({ ...v, [def.key]: clone(def.default) }));
      setOverrides((o) => {
        const next = { ...o };
        delete next[def.key];
        return next;
      });
      setFeedback((f) => ({
        ...f,
        [def.key]: { ok: true, message: "Back to the default ✓" },
      }));
    } else {
      setFeedback((f) => ({
        ...f,
        [def.key]: { ok: false, message: res.error ?? "Couldn't reset." },
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
          role="tablist"
          aria-label="Website pages"
        >
          {STUDIO_PAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={page === p.id}
              onClick={() => setPage(p.id)}
              className={`h-11 shrink-0 rounded-lg px-4 text-sm font-medium whitespace-nowrap ${
                page === p.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <a
          href={PAGE_ROUTES[page]}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          View live page ↗
        </a>
      </div>

      {sections.map(([section, defs]) => (
        <Card key={section}>
          <CardHeader>
            <CardTitle>{section}</CardTitle>
          </CardHeader>
          <CardContent>
            {defs.map((def) => (
              <ContentField
                key={def.key}
                def={def}
                value={values[def.key]}
                overridden={def.key in overrides}
                onChange={(v) =>
                  setValues((prev) => ({ ...prev, [def.key]: v }))
                }
                onSave={() => handleSave(def)}
                onReset={() => handleReset(def)}
                saving={saving[def.key] === true}
                feedback={feedback[def.key] ?? null}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
