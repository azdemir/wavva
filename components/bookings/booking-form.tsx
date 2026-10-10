"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextareaField } from "@/components/ui/input";
import { createBooking } from "@/lib/actions/bookings";

export type FormCustomer = {
  id: string;
  name: string;
  addresses: { id: string; label: string; address_line1: string; city: string; state: string; is_default: boolean }[];
};
export type FormService = { id: string; name: string };
export type FormChecklistTemplate = { id: string; name: string; items: { label: string }[] };

export type BookingPrefill = {
  quoteId?: string;
  customerId?: string;
  addressId?: string;
  serviceId?: string;
  notes?: string;
  /** YYYY-MM-DD date to prefill the start/end datetime fields (from the schedule). */
  startDate?: string;
};

export function BookingForm({
  customers,
  services,
  checklistTemplates = [],
  prefill,
}: {
  customers: FormCustomer[];
  services: FormService[];
  checklistTemplates?: FormChecklistTemplate[];
  prefill?: BookingPrefill;
}) {
  const t = useTranslations("bookings");
  const [customerId, setCustomerId] = useState(prefill?.customerId ?? customers[0]?.id ?? "");
  const customer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId],
  );
  const [addressId, setAddressId] = useState(
    prefill?.addressId ?? customer?.addresses.find((a) => a.is_default)?.id ?? customer?.addresses[0]?.id ?? "",
  );
  const [serviceId, setServiceId] = useState(prefill?.serviceId ?? "");
  const [recurrence, setRecurrence] = useState("none");
  const [templateId, setTemplateId] = useState("");
  const [start, setStart] = useState(prefill?.startDate ? `${prefill.startDate}T09:00` : "");
  const [end, setEnd] = useState(prefill?.startDate ? `${prefill.startDate}T11:00` : "");
  const [notes, setNotes] = useState(prefill?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const selectedTemplate = useMemo(
    () => checklistTemplates.find((x) => x.id === templateId),
    [checklistTemplates, templateId],
  );

  function onCustomerChange(id: string) {
    setCustomerId(id);
    const c = customers.find((x) => x.id === id);
    setAddressId(c?.addresses.find((a) => a.is_default)?.id ?? c?.addresses[0]?.id ?? "");
  }

  async function submit() {
    // Instant check before the round trip: the end must be after the start.
    if (start && end && new Date(end).getTime() <= new Date(start).getTime()) {
      setError(t("form.endAfterStart"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await createBooking({
        customer_id: customerId,
        service_address_id: addressId,
        service_id: serviceId || "",
        quote_id: prefill?.quoteId || "",
        checklist_template_id: templateId || "",
        recurrence,
        scheduled_start: start,
        scheduled_end: end,
        notes,
      });
      if (result?.error) setError(result.error);
      // Success redirects to the booking detail page.
    } catch (e) {
      // A successful create navigates away via redirect() — let that through.
      const digest = (e as { digest?: unknown })?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw e;
      setError(t("form.createFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField id="bk-customer" label={t("form.customer")} value={customerId} onChange={(e) => onCustomerChange(e.target.value)}>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </SelectField>
        <div>
          <SelectField id="bk-address" label={t("form.serviceAddress")} value={addressId} onChange={(e) => setAddressId(e.target.value)}>
            {(customer?.addresses ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}: {a.address_line1}, {a.city}
              </option>
            ))}
          </SelectField>
          {(customer?.addresses ?? []).length === 0 && (
            <p className="mt-1 text-xs text-red-600">{t("form.noAddresses")}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField id="bk-service" label={t("form.service")} value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          <option value="">—</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </SelectField>
        <SelectField id="bk-recurrence" label={t("form.repeats")} value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
          <option value="none">{t("form.repeatNone")}</option>
          <option value="weekly">{t("form.repeatWeekly")}</option>
          <option value="biweekly">{t("form.repeatBiweekly")}</option>
          <option value="monthly">{t("form.repeatMonthly")}</option>
        </SelectField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="bk-start" label={t("form.start")} type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} />
        <Field id="bk-end" label={t("form.end")} type="datetime-local" required value={end} onChange={(e) => setEnd(e.target.value)} />
      </div>

      {checklistTemplates.length > 0 && (
        <div>
          <SelectField id="bk-template" label={t("form.checklistTemplate")} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">{t("form.noChecklist")}</option>
            {checklistTemplates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name} ({t("form.checklistItems", { count: tpl.items.length })})
              </option>
            ))}
          </SelectField>
          {selectedTemplate && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("form.checklistHint")}</p>
          )}
        </div>
      )}

      <TextareaField id="bk-notes" label={t("form.notes")} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("form.notesPlaceholder")} />

      <Button onClick={submit} disabled={pending || !customerId || !addressId || !start || !end} className="w-full sm:w-auto">
        {pending ? t("form.creating") : t("form.createBooking")}
      </Button>
      {!pending && customerId && !addressId && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          {t("form.noAddresses")}
        </p>
      )}
    </div>
  );
}
