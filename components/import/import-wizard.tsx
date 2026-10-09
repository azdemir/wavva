"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  disconnectImportProvider,
  fetchImportProviderRows,
  getApiImportStatus,
  saveHousecallKey,
  type ApiProviderStatus,
} from "@/lib/actions/import-connections";
import type { ApiProviderKey } from "@/lib/import/providers/types";
import { parseCsv } from "@/lib/import/csv";
import {
  PLATFORM_IDS,
  TIDYPRO_FIELDS,
  suggestMapping,
  type PlatformId,
  type TidyProField,
} from "@/lib/import/presets";
import {
  combineApptStart,
  rowName,
  validateMappedRow,
  type MappedRow,
} from "@/lib/import/validate";
import {
  commitImport,
  findImportDuplicates,
  type DuplicateMatch,
  type DedupeChoice,
} from "@/lib/actions/import";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 2000;
const PREVIEW_ROWS = 20;

type Step = "source" | "mapping" | "preview" | "duplicates" | "done";

const STEP_ORDER: Step[] = ["source", "mapping", "preview", "duplicates", "done"];

/** Platforms that genuinely have no public API — badge only, never "integration". */
const CSV_BADGE_ONLY: PlatformId[] = ["zenmaid", "bookingkoala", "generic"];

function Stepper({
  step,
  labels,
}: {
  step: Step;
  labels: Record<Step, string>;
}) {
  const active = STEP_ORDER.indexOf(step);
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs" aria-label="progress">
      {STEP_ORDER.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full font-semibold ${
              i < active
                ? "bg-brand-600 text-white"
                : i === active
                  ? "bg-brand-100 text-brand-700 ring-2 ring-brand-600 dark:bg-brand-900 dark:text-brand-200"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {i + 1}
          </span>
          <span
            className={
              i === active
                ? "font-semibold text-slate-900 dark:text-slate-100"
                : "text-slate-500 dark:text-slate-400"
            }
          >
            {labels[s]}
          </span>
          {i < STEP_ORDER.length - 1 && (
            <span className="mx-1 text-slate-300 dark:text-slate-600">›</span>
          )}
        </li>
      ))}
    </ol>
  );
}

function PlatformCard({
  platform,
  file,
  onFile,
}: {
  platform: PlatformId;
  file: { name: string; platform: PlatformId } | null;
  onFile: (platform: PlatformId, f: File) => void;
}) {
  const t = useTranslations("import");
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        drag
          ? "border-brand-500 bg-brand-50 dark:bg-brand-950"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(platform, f);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {t(`platforms.${platform}.name`)}
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {t(`platforms.${platform}.description`)}
          </p>
        </div>
        {CSV_BADGE_ONLY.includes(platform) ? (
          <Badge tone="brand">{t(`platforms.${platform}.badge`)}</Badge>
        ) : (
          <Badge tone="slate">CSV</Badge>
        )}
      </div>
      {!CSV_BADGE_ONLY.includes(platform) && (
        <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">
          {t(`platforms.${platform}.note`)}
        </p>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-3 flex w-full items-center justify-center rounded-lg border border-dashed border-slate-300 px-3 py-6 text-sm text-slate-500 transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400"
      >
        <span className="text-center">
          {file && file.platform === platform ? (
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {t("upload.selected")}: {file.name}
            </span>
          ) : (
            t("upload.drop")
          )}
          <span className="mt-1 block text-xs">{t("upload.hint")}</span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(platform, f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

const API_PROVIDER_ORDER: ApiProviderKey[] = ["jobber", "housecallpro", "google"];

/**
 * Card for an API-based import source. Shows the real status: setup
 * required (env not configured), connect / API-key form, or connected with
 * Fetch + Disconnect. Nothing is ever labeled "supported" until its
 * connect→fetch→preview→dedupe→commit path exists — all three cards below
 * have that full path implemented.
 */
function ApiProviderCard({
  provider,
  status,
  fetching,
  disconnecting,
  onFetch,
  onDisconnect,
  onSaveKey,
}: {
  provider: ApiProviderKey;
  status: ApiProviderStatus | null;
  fetching: boolean;
  disconnecting: boolean;
  onFetch: (provider: ApiProviderKey) => void;
  onDisconnect: (provider: ApiProviderKey) => void;
  onSaveKey: (provider: ApiProviderKey, key: string) => Promise<void>;
}) {
  const t = useTranslations("import");
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);

  const configured = status?.configured ?? false;
  const connected = status?.connected ?? false;

  async function handleSaveKey() {
    if (!key.trim() || saving) return;
    setSaving(true);
    try {
      await onSaveKey(provider, key);
      setKey("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {t(`api.providers.${provider}.name`)}
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {t(`api.providers.${provider}.description`)}
          </p>
        </div>
        {status ? (
          !configured ? (
            <Badge tone="amber">{t("api.setupRequired")}</Badge>
          ) : connected ? (
            <Badge tone="brand">
              {status.accountName
                ? t("api.connectedAs", { name: status.accountName })
                : t("api.connected")}
            </Badge>
          ) : (
            <Badge tone="slate">API</Badge>
          )
        ) : null}
      </div>

      {provider === "jobber" && (
        <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">
          {t("api.providers.jobber.note")}
        </p>
      )}
      {provider === "housecallpro" && (
        <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
          {t("api.providers.housecallpro.maxPlanNote")}
        </p>
      )}
      {provider === "google" && (
        <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">
          {t("api.providers.google.verificationNote")}
        </p>
      )}

      <div className="mt-3">
        {!configured ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("api.setupRequiredHint")}
          </p>
        ) : !connected ? (
          provider === "housecallpro" ? (
            <div className="space-y-2">
              <label
                htmlFor={`hcp-key-${provider}`}
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t("api.keyLabel")}
              </label>
              <input
                id={`hcp-key-${provider}`}
                type="password"
                autoComplete="off"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={t("api.keyPlaceholder")}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <Button onClick={handleSaveKey} disabled={!key.trim() || saving}>
                {saving ? t("api.savingKey") : t("api.saveKey")}
              </Button>
            </div>
          ) : (
            <Button href={`/api/import/${provider}/connect`}>
              {t("api.connect")}
            </Button>
          )
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onFetch(provider)} disabled={fetching}>
              {fetching ? t("api.fetching") : t("api.fetch")}
            </Button>
            <Button
              variant="outline"
              onClick={() => onDisconnect(provider)}
              disabled={disconnecting}
            >
              {disconnecting ? t("api.disconnecting") : t("api.disconnect")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ImportWizard({
  timezone,
  connected,
  importError,
}: {
  timezone: string;
  connected?: string;
  importError?: string;
}) {
  const t = useTranslations("import");
  const [step, setStep] = useState<Step>("source");
  const [platform, setPlatform] = useState<PlatformId | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Record<string, TidyProField | null>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[] | null>(null);
  const [choices, setChoices] = useState<Record<number, DedupeChoice>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    created_customers?: number;
    created_bookings?: number;
    errors?: { row: number; message: string }[];
  } | null>(null);

  // API import sources (Jobber / Housecall Pro / Google Calendar). API rows
  // are already normalized to MappedRow, so they skip the mapping step.
  const [apiStatuses, setApiStatuses] = useState<ApiProviderStatus[] | null>(null);
  const [apiRows, setApiRows] = useState<MappedRow[] | null>(null);
  const [apiProvider, setApiProvider] = useState<ApiProviderKey | null>(null);
  const [fetchingKey, setFetchingKey] = useState<ApiProviderKey | null>(null);
  const [disconnectingKey, setDisconnectingKey] =
    useState<ApiProviderKey | null>(null);

  // OAuth connect results arrive as query params from page.tsx.
  const connectedKey = (
    ["jobber", "housecallpro", "google"] as const
  ).includes(connected as ApiProviderKey)
    ? (connected as ApiProviderKey)
    : null;
  const callbackErrorKey = (
    [
      "not_permitted",
      "not_configured",
      "state_mismatch",
      "oauth_denied",
      "oauth_failed",
    ] as const
  ).includes(
    importError as
      | "not_permitted"
      | "not_configured"
      | "state_mismatch"
      | "oauth_denied"
      | "oauth_failed",
  )
    ? (importError as
        | "not_permitted"
        | "not_configured"
        | "state_mismatch"
        | "oauth_denied"
        | "oauth_failed")
    : null;

  useEffect(() => {
    let live = true;
    getApiImportStatus().then((res) => {
      if (!live) return;
      if (res.statuses) setApiStatuses(res.statuses);
      else setUploadError(res.error ?? "");
    });
    return () => {
      live = false;
    };
  }, []);

  async function refreshApiStatuses() {
    const res = await getApiImportStatus();
    if (res.statuses) setApiStatuses(res.statuses);
  }

  async function handleApiFetch(key: ApiProviderKey) {
    setUploadError(null);
    setFetchingKey(key);
    try {
      const res = await fetchImportProviderRows(key);
      if (res.error || !res.rows) {
        setUploadError(res.error ?? "");
      } else {
        setApiRows(res.rows);
        setApiProvider(key);
        // Clear any CSV state so the shared steps use the API rows.
        setPlatform(null);
        setHeaders([]);
        setDataRows([]);
        setFileName("");
        setMapping({});
        setDuplicates(null);
        setResult(null);
        setChoices({});
        setStep("preview");
      }
    } finally {
      setFetchingKey(null);
    }
  }

  async function handleApiDisconnect(key: ApiProviderKey) {
    setUploadError(null);
    setDisconnectingKey(key);
    try {
      const res = await disconnectImportProvider(key);
      if (res.error) setUploadError(res.error);
      else await refreshApiStatuses();
    } finally {
      setDisconnectingKey(null);
    }
  }

  async function handleSaveApiKey(key: ApiProviderKey, apiKey: string) {
    setUploadError(null);
    const res = await saveHousecallKey(apiKey);
    if (res.error) setUploadError(res.error);
    else await refreshApiStatuses();
  }

  const mappedRows: MappedRow[] = dataRows.map((cells) => {
    const row: MappedRow = {};
    headers.forEach((h, i) => {
      const field = mapping[h];
      if (field) {
        const prev = row[field];
        row[field] = prev ? `${prev} ${cells[i] ?? ""}` : (cells[i] ?? "");
      }
    });
    // Combine first + last into name when no explicit name column is mapped.
    if (!row.name && (row.first_name || row.last_name)) {
      row.name = [row.first_name ?? "", row.last_name ?? ""].filter(Boolean).join(" ");
    }
    return row;
  });

  // API rows skip the mapping step — fields are already known.
  const previewRows: MappedRow[] = apiRows ?? mappedRows;

  const rowErrors: string[][] = previewRows.map((r) =>
    validateMappedRow(r, timezone),
  );

  function handleFile(p: PlatformId, file: File) {
    setUploadError(null);
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv")) {
      setUploadError(t("upload.errors.type"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError(t("upload.errors.size"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { headers: hdrs, rows } = parseCsv(String(reader.result ?? ""));
        if (hdrs.length === 0 || rows.length === 0) {
          setUploadError(t("upload.errors.empty"));
          return;
        }
        if (rows.length > MAX_ROWS) {
          setUploadError(t("upload.errors.tooMany"));
          return;
        }
        setPlatform(p);
        setHeaders(hdrs);
        setDataRows(rows);
        setFileName(file.name);
        setMapping(suggestMapping(p, hdrs));
        setDuplicates(null);
        setResult(null);
        setApiRows(null);
        setApiProvider(null);
        setStep("mapping");
      } catch {
        setUploadError(t("upload.errors.parse"));
      }
    };
    reader.onerror = () => setUploadError(t("upload.errors.parse"));
    reader.readAsText(file);
  }

  function reset() {
    setStep("source");
    setPlatform(null);
    setHeaders([]);
    setDataRows([]);
    setFileName("");
    setMapping({});
    setUploadError(null);
    setDuplicates(null);
    setChoices({});
    setResult(null);
    setBusy(false);
    setApiRows(null);
    setApiProvider(null);
  }

  async function handleCheckDuplicates() {
    setBusy(true);
    try {
      const res = await findImportDuplicates(previewRows);
      if (res.error || !res.matches) {
        setUploadError(res.error ?? "");
      } else {
        setDuplicates(res.matches);
        const initial: Record<number, DedupeChoice> = {};
        for (const m of res.matches) {
          if (m.status === "duplicate") initial[m.index] = "skip";
        }
        setChoices(initial);
        setStep("duplicates");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCommit() {
    setBusy(true);
    try {
      const res = await commitImport({
        rows: previewRows,
        mapping,
        dedupeChoices: choices,
      });
      if (res.error) {
        setUploadError(res.error);
        setStep("preview");
      } else {
        setResult(res);
        setStep("done");
      }
    } finally {
      setBusy(false);
    }
  }

  const stepLabels: Record<Step, string> = {
    source: t("steps.source"),
    mapping: t("steps.mapping"),
    preview: t("steps.preview"),
    duplicates: t("steps.duplicates"),
    done: t("steps.results"),
  };

  const dupList = (duplicates ?? []).filter((d) => d.status === "duplicate");
  const newCount = (duplicates ?? []).length - dupList.length;

  return (
    <div className="space-y-6">
      <Stepper step={step} labels={stepLabels} />

      {uploadError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {uploadError}
        </div>
      )}

      {connectedKey && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
        >
          {t("api.connectedMessage", {
            provider: t(`api.providers.${connectedKey}.name`),
          })}
        </div>
      )}

      {callbackErrorKey && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {t(`api.callbackErrors.${callbackErrorKey}`)}
        </div>
      )}

      {step === "source" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_IDS.map((p) => (
              <PlatformCard
                key={p}
                platform={p}
                file={platform && fileName ? { name: fileName, platform } : null}
                onFile={handleFile}
              />
            ))}
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {t("api.title")}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {t("api.description")}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {API_PROVIDER_ORDER.map((k) => (
                <ApiProviderCard
                  key={k}
                  provider={k}
                  status={apiStatuses?.find((s) => s.key === k) ?? null}
                  fetching={fetchingKey === k}
                  disconnecting={disconnectingKey === k}
                  onFetch={handleApiFetch}
                  onDisconnect={handleApiDisconnect}
                  onSaveKey={handleSaveApiKey}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {step === "mapping" && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              {t("mapping.description")} ({fileName})
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                    <th className="pb-2 pr-4 font-medium text-slate-700 dark:text-slate-300">
                      {t("mapping.column")}
                    </th>
                    <th className="pb-2 font-medium text-slate-700 dark:text-slate-300">
                      {t("mapping.mappedTo")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((h) => (
                    <tr
                      key={h}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="py-2 pr-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {h}
                      </td>
                      <td className="py-2">
                        <select
                          value={mapping[h] ?? ""}
                          onChange={(e) =>
                            setMapping((m) => ({
                              ...m,
                              [h]: (e.target.value || null) as TidyProField | null,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        >
                          <option value="">{t("mapping.doNotImport")}</option>
                          {TIDYPRO_FIELDS.map((f) => (
                            <option key={f} value={f}>
                              {t(`mapping.fields.${f}`)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep("source")}>
                {t("buttons.back")}
              </Button>
              <Button onClick={() => setStep("preview")}>
                {t("buttons.continue")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              {apiRows && apiProvider
                ? `${t("api.fetchedCount", { count: previewRows.length })} — ${t(`api.providers.${apiProvider}.name`)}`
                : t("preview.description")}
            </p>
            {previewRows.some((r) => !rowName(r)) && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                {t("preview.unmappedWarning")}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                    <th className="pb-2 pr-4 font-medium text-slate-700 dark:text-slate-300">
                      {t("preview.row")}
                    </th>
                    <th className="pb-2 pr-4 font-medium text-slate-700 dark:text-slate-300">
                      {t("preview.customer")}
                    </th>
                    <th className="pb-2 pr-4 font-medium text-slate-700 dark:text-slate-300">
                      {t("preview.contact")}
                    </th>
                    <th className="pb-2 pr-4 font-medium text-slate-700 dark:text-slate-300">
                      {t("preview.appointment")}
                    </th>
                    <th className="pb-2 font-medium text-slate-700 dark:text-slate-300">
                      {" "}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, PREVIEW_ROWS).map((r, i) => {
                    const errs = rowErrors[i] ?? [];
                    const start = (r.appt_start ?? "").trim() || (r.appt_date ?? "").trim();
                    return (
                      <tr
                        key={i}
                        className={`border-b border-slate-100 dark:border-slate-800 ${
                          errs.length > 0 ? "bg-red-50/50 dark:bg-red-950/20" : ""
                        }`}
                      >
                        <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">
                          {i + 1}
                        </td>
                        <td className="py-2 pr-4 font-medium text-slate-900 dark:text-slate-100">
                          {rowName(r) || "—"}
                        </td>
                        <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">
                          {[r.email, r.phone].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">
                          {start ? combineApptStart(r) : t("preview.noAppointment")}
                        </td>
                        <td className="py-2">
                          {errs.length > 0 && (
                            <span className="text-xs text-red-600 dark:text-red-400">
                              {errs.map((c) => t(`validation.${c}`)).join(" ")}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(apiRows ? "source" : "mapping")}
              >
                {t("buttons.back")}
              </Button>
              <Button onClick={handleCheckDuplicates} disabled={busy}>
                {busy ? t("duplicates.loading") : t("buttons.checkDuplicates")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "duplicates" && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge tone="brand">
                {t("duplicates.newCount", { count: newCount })}
              </Badge>
              <Badge tone="slate">
                {t("duplicates.duplicateCount", { count: dupList.length })}
              </Badge>
            </div>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              {t("duplicates.description")}
            </p>
            {dupList.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("preview.noErrors")}
              </p>
            ) : (
              <ul className="space-y-3">
                {dupList.map((d) => {
                  const row = previewRows[d.index];
                  return (
                    <li
                      key={d.index}
                      className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                    >
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {rowName(row)}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {t("duplicates.matchedOn", {
                          name: d.matchedName ?? "",
                          method: t(`duplicates.method.${d.matchOn ?? "email"}`),
                        })}
                      </div>
                      <div className="mt-2 flex gap-4 text-sm">
                        <label className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name={`dedupe-${d.index}`}
                            checked={(choices[d.index] ?? "skip") === "skip"}
                            onChange={() =>
                              setChoices((c) => ({ ...c, [d.index]: "skip" }))
                            }
                          />
                          {t("duplicates.skip")}
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name={`dedupe-${d.index}`}
                            checked={choices[d.index] === "import"}
                            onChange={() =>
                              setChoices((c) => ({ ...c, [d.index]: "import" }))
                            }
                          />
                          {t("duplicates.importAnyway")}
                        </label>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap justify-between gap-2">
              <Button variant="outline" onClick={() => setStep("preview")}>
                {t("buttons.back")}
              </Button>
              <Button onClick={handleCommit} disabled={busy}>
                {busy ? t("buttons.committing") : t("buttons.commit")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "done" && result && (
        <Card>
          <CardContent className="p-4 text-center sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t("results.title")}
            </h2>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Badge tone="brand">
                {t("results.customersCreated", {
                  count: result.created_customers ?? 0,
                })}
              </Badge>
              <Badge tone="brand">
                {t("results.bookingsCreated", {
                  count: result.created_bookings ?? 0,
                })}
              </Badge>
            </div>
            {(result.errors ?? []).length > 0 && (
              <div className="mt-4 text-left">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t("results.errorsTitle")}
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-red-600 dark:text-red-400">
                  {(result.errors ?? []).map((e, i) => (
                    <li key={i}>
                      {t("results.row")} {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6">
              <Button variant="outline" onClick={reset}>
                {t("results.startOver")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
