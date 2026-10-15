"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, TextareaField, SelectField } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon } from "@/components/ui/icons";
import { parseCsv } from "@/lib/import/csv";
import { track } from "@/lib/analytics";
import {
  saveFrontOfficePriceList,
  saveFrontOfficeBasics,
  importFrontOfficeCustomers,
  type PriceListItem,
  type FrontOfficeSettingsView,
} from "@/lib/actions/front-office";

const STEPS = [
  "Services & prices",
  "Service area",
  "Policies & rules",
  "Business line & inbox",
  "Customer list",
] as const;

type CsvRow = {
  name: string;
  phone: string;
  email: string;
  smsConsent: boolean;
  emailConsent: boolean;
};

function StepDots({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Setup progress">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              i < step
                ? "bg-accent-600 text-white"
                : i === step
                  ? "bg-brand-600 text-white"
                  : "bg-slate-200 text-slate-500 dark:bg-slate-800"
            }`}
            aria-current={i === step ? "step" : undefined}
          >
            {i < step ? <CheckIcon className="h-4 w-4" /> : i + 1}
          </span>
          <span className="hidden text-xs font-medium text-slate-600 sm:inline dark:text-slate-400">
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <span className="mx-1 h-px w-4 bg-slate-200 sm:w-8 dark:bg-slate-700" aria-hidden="true" />
          )}
        </li>
      ))}
    </ol>
  );
}

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    >
      {error}
    </div>
  );
}

/**
 * Guided online setup for the Front Office Service (approved founding
 * clients). 5 steps; everything saves to front_office_settings, and the
 * customer CSV writes per-customer consent flags to customers.
 */
export function SetupWizard({ initial }: { initial: FrontOfficeSettingsView | null }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Step 1 — price list
  const [prices, setPrices] = useState<PriceListItem[]>(
    initial?.price_list?.length
      ? initial.price_list
      : [{ name: "", price_cents: 0, unit: "per visit" }],
  );
  const [draft, setDraft] = useState({ name: "", price: "", maxPrice: "", unit: "per visit" });

  // Steps 2–4
  const [serviceArea, setServiceArea] = useState(initial?.service_area ?? "");
  const [policies, setPolicies] = useState(initial?.policies ?? "");
  const [businessLine, setBusinessLine] = useState(initial?.business_line ?? "");
  const [enquiryInbox, setEnquiryInbox] = useState(initial?.enquiry_inbox ?? "");
  const [timezone, setTimezone] = useState(initial?.timezone ?? "America/New_York");

  // Step 5 — CSV
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, "ignore" | "name" | "phone" | "email">>({});
  const [consentRows, setConsentRows] = useState<CsvRow[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  const mappedRows = useMemo<CsvRow[]>(() => {
    const nameIdx = csvHeaders.findIndex((h) => mapping[h] === "name");
    const phoneIdx = csvHeaders.findIndex((h) => mapping[h] === "phone");
    const emailIdx = csvHeaders.findIndex((h) => mapping[h] === "email");
    if (nameIdx === -1) return [];
    return csvRows.map((r) => ({
      name: r[nameIdx] ?? "",
      phone: phoneIdx === -1 ? "" : (r[phoneIdx] ?? ""),
      email: emailIdx === -1 ? "" : (r[emailIdx] ?? ""),
      smsConsent: false,
      emailConsent: false,
    }));
  }, [csvHeaders, csvRows, mapping]);

  async function next() {
    setError(null);
    setSaving(true);
    try {
      if (step === 0) {
        const items = prices.filter((p) => p.name.trim());
        if (items.length === 0) {
          setError("Add at least one service with a price — this becomes your AI assistant's price list.");
          setSaving(false);
          return;
        }
        const res = await saveFrontOfficePriceList(items);
        if (!res.ok) throw new Error(res.error);
      } else if (step === 3) {
        const res = await saveFrontOfficeBasics({
          service_area: serviceArea,
          policies,
          business_line: businessLine,
          enquiry_inbox: enquiryInbox,
          timezone,
        });
        if (!res.ok) throw new Error(res.error);
      }
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const { headers, rows } = parseCsv(String(reader.result ?? ""));
      setCsvHeaders(headers);
      setCsvRows(rows);
      // Auto-map obvious column names.
      const auto: Record<string, "ignore" | "name" | "phone" | "email"> = {};
      for (const h of headers) {
        const low = h.toLowerCase();
        auto[h] =
          /name|customer|client/.test(low) ? "name"
          : /phone|mobile|cell/.test(low) ? "phone"
          : /mail|e-mail/.test(low) ? "email"
          : "ignore";
      }
      setMapping(auto);
      setConsentRows([]);
      setImportResult(null);
    };
    reader.readAsText(file);
  }

  async function finish() {
    setError(null);
    setSaving(true);
    try {
      const rows = consentRows
        .filter((r) => r.name.trim())
        .map((r) => ({
          name: r.name.trim(),
          phone: r.phone.trim(),
          email: r.email.trim(),
          sms_consent: r.smsConsent,
          email_consent: r.emailConsent,
        }));
      const res = await importFrontOfficeCustomers(rows);
      if (!res.ok) throw new Error(res.error);
      setImportResult({ imported: res.imported, skipped: res.skipped });
      track("wizard_complete", { company_id: res.companyId });
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't import. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Setup complete!
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
            {importResult
              ? `${importResult.imported} customers imported${importResult.skipped ? ` (${importResult.skipped} duplicates skipped)` : ""}. `
              : ""}
            We&apos;ll connect your business line and enquiry inbox next, and
            your AI assistant will start answering in your company&apos;s name.
          </p>
          <Button href="/dashboard/front-office" className="mt-6">
            Go to your Front Office
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <StepDots step={step} />
      <ErrorBox error={error} />

      {/* ------------------------------------------------ Step 1: prices */}
      {step === 0 && (
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Your services and prices
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              This becomes your AI assistant&apos;s price list. It only ever
              quotes from this list — anything else waits for your OK.
            </p>
            <ul className="mt-6 space-y-2">
              {prices
                .filter((p) => p.name.trim())
                .map((p) => (
                  <li
                    key={`${p.name}-${p.price_cents}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-800"
                  >
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {p.name}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        {p.unit}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {p.price_max_cents != null &&
                        p.price_min_cents != null &&
                        p.price_max_cents > p.price_min_cents
                          ? `$${(p.price_min_cents / 100).toFixed(2)}–$${(p.price_max_cents / 100).toFixed(2)}`
                          : `$${(p.price_cents / 100).toFixed(2)}`}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPrices((list) => list.filter((x) => x !== p))
                        }
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        aria-label={`Remove ${p.name}`}
                      >
                        Remove
                      </button>
                    </span>
                  </li>
                ))}
            </ul>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_7rem_7rem_8rem_auto]">
              <Field
                id="price-name"
                label="Service"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Standard home cleaning"
              />
              <Field
                id="price-amount"
                label="Price ($) or from"
                type="number"
                min={0}
                step="0.01"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                placeholder="149.00"
              />
              <Field
                id="price-max"
                label="Up to ($) — optional"
                hint="Fill for a range"
                type="number"
                min={0}
                step="0.01"
                value={draft.maxPrice}
                onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })}
                placeholder="229.00"
              />
              <Field
                id="price-unit"
                label="Per"
                value={draft.unit}
                onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                placeholder="per visit"
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const cents = Math.round(Number(draft.price) * 100);
                    const maxCents = draft.maxPrice.trim()
                      ? Math.round(Number(draft.maxPrice) * 100)
                      : undefined;
                    if (!draft.name.trim() || Number.isNaN(cents) || cents < 0) {
                      setError("Enter a service name and a price to add it.");
                      return;
                    }
                    if (maxCents !== undefined && (Number.isNaN(maxCents) || maxCents <= cents)) {
                      setError("The “up to” price must be above the starting price.");
                      return;
                    }
                    setError(null);
                    setPrices((list) => [
                      ...list.filter((p) => p.name.trim()),
                      {
                        name: draft.name.trim(),
                        price_cents: cents,
                        ...(maxCents !== undefined
                          ? { price_min_cents: cents, price_max_cents: maxCents }
                          : {}),
                        unit: draft.unit.trim() || "per visit",
                      },
                    ]);
                    setDraft({ name: "", price: "", maxPrice: "", unit: "per visit" });
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Tip: leave “Up to” empty for a fixed price. With a range, the AI quotes
              “typically between $X and $Y” — never a number you didn&apos;t set.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------ Step 2: area */}
      {step === 1 && (
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Your service area
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Where do you work? Cities, towns, ZIP codes, or a radius —
              whatever you tell customers today.
            </p>
            <div className="mt-4">
              <TextareaField
                id="service-area"
                label="Service area"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                rows={3}
                placeholder="Albany, Schenectady, Troy and surrounding towns…"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------ Step 3: policies */}
      {step === 2 && (
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Your policies and rules
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Cancellation policy, what&apos;s included or not, pets, parking —
              anything your assistant should know before quoting or booking.
            </p>
            <div className="mt-4">
              <TextareaField
                id="policies"
                label="Policies & rules"
                value={policies}
                onChange={(e) => setPolicies(e.target.value)}
                rows={5}
                placeholder="24-hour cancellation policy. We bring all supplies. No laundry…"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------ Step 4: line+inbox */}
      {step === 3 && (
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Your business line and enquiry inbox
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              These forward to your AI assistant in the next step. Your number
              stays yours, and everything goes out under your company&apos;s
              name.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                id="business-line"
                label="Business line"
                type="tel"
                value={businessLine}
                onChange={(e) => setBusinessLine(e.target.value)}
                placeholder="(518) 555-0100"
              />
              <Field
                id="enquiry-inbox"
                label="Enquiry inbox email"
                type="email"
                value={enquiryInbox}
                onChange={(e) => setEnquiryInbox(e.target.value)}
                placeholder="hello@yourcompany.com"
              />
            </div>
            <div className="mt-4 max-w-xs">
              <SelectField
                id="tz"
                label="Company timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {[
                  "America/New_York",
                  "America/Chicago",
                  "America/Denver",
                  "America/Los_Angeles",
                  "America/Anchorage",
                  "Pacific/Honolulu",
                ].map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace("_", " ")}
                  </option>
                ))}
              </SelectField>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Outbound texts only go out between 8am and 9pm in this timezone.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------ Step 5: CSV */}
      {step === 4 && (
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Upload your customer list
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Upload a CSV, map the columns, and tick consent for each customer
              you want the assistant to text or email. No tick, no follow-ups —
              ever.
            </p>
            <div className="mt-4">
              <label
                htmlFor="csv-file"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Customer CSV
              </label>
              <input
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                className="mt-1 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700 dark:text-slate-400"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>

            {csvHeaders.length > 0 && (
              <div className="mt-6 space-y-4">
                <fieldset>
                  <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Map your columns
                  </legend>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {csvHeaders.map((h) => (
                      <div key={h}>
                        <SelectField
                          id={`map-${h}`}
                          label={h}
                          value={mapping[h] ?? "ignore"}
                          onChange={(e) =>
                            setMapping((m) => ({
                              ...m,
                              [h]: e.target.value as "ignore" | "name" | "phone" | "email",
                            }))
                          }
                        >
                          <option value="ignore">Ignore</option>
                          <option value="name">Name</option>
                          <option value="phone">Phone</option>
                          <option value="email">Email</option>
                        </SelectField>
                      </div>
                    ))}
                  </div>
                </fieldset>

                {mappedRows.length > 0 && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setConsentRows(
                            mappedRows.map((r) => ({
                              ...r,
                              smsConsent: !!r.phone,
                              emailConsent: !!r.email,
                            })),
                          )
                        }
                      >
                        Tick consent for all listed
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setConsentRows(
                            mappedRows.map((r) => ({ ...r, smsConsent: false, emailConsent: false })),
                          )
                        }
                      >
                        Clear all
                      </Button>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                      <table className="w-full min-w-[520px] text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-left dark:bg-slate-900">
                            <th className="px-3 py-2 font-medium">Name</th>
                            <th className="px-3 py-2 font-medium">Phone</th>
                            <th className="px-3 py-2 font-medium">Email</th>
                            <th className="px-3 py-2 text-center font-medium">
                              <span className="sr-only">Text consent</span>
                              <span aria-hidden="true">Text OK</span>
                            </th>
                            <th className="px-3 py-2 text-center font-medium">
                              <span className="sr-only">Email consent</span>
                              <span aria-hidden="true">Email OK</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(consentRows.length ? consentRows : mappedRows).map((r, i) => (
                            <tr
                              key={i}
                              className="border-t border-slate-100 dark:border-slate-800"
                            >
                              <td className="px-3 py-2">{r.name}</td>
                              <td className="px-3 py-2 text-slate-500">{r.phone || "—"}</td>
                              <td className="px-3 py-2 text-slate-500">{r.email || "—"}</td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={r.smsConsent}
                                  disabled={!r.phone}
                                  onChange={(e) => {
                                    const rows =
                                      consentRows.length ? [...consentRows] : [...mappedRows];
                                    rows[i] = { ...rows[i], smsConsent: e.target.checked };
                                    setConsentRows(rows);
                                  }}
                                  aria-label={`Text consent for ${r.name}`}
                                  className="h-4 w-4 accent-brand-600"
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={r.emailConsent}
                                  disabled={!r.email}
                                  onChange={(e) => {
                                    const rows =
                                      consentRows.length ? [...consentRows] : [...mappedRows];
                                    rows[i] = { ...rows[i], emailConsent: e.target.checked };
                                    setConsentRows(rows);
                                  }}
                                  aria-label={`Email consent for ${r.name}`}
                                  className="h-4 w-4 accent-brand-600"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Consent is recorded with the date and source. The
                      assistant never texts or emails customers without it.
                    </p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------- navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0 || saving}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next} disabled={saving}>
            {saving ? "Saving…" : "Continue"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => {
              setConsentRows((rows) => (rows.length ? rows : mappedRows));
              finish();
            }}
            disabled={saving || (csvHeaders.length > 0 && mappedRows.length === 0)}
          >
            {saving ? "Finishing…" : "Finish setup"}
          </Button>
        )}
      </div>

      {step === 4 && csvHeaders.length === 0 && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          No customer list handy? You can skip the upload — just continue
          without a file and finish setup.
        </p>
      )}
    </div>
  );
}
