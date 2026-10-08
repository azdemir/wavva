"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextareaField } from "@/components/ui/input";
import { createBooking } from "@/lib/actions/bookings";

export type FormCustomer = {
  id: string;
  name: string;
  addresses: { id: string; label: string; address_line1: string; city: string; state: string; is_default: boolean }[];
};
export type FormService = { id: string; name: string };

export type BookingPrefill = {
  quoteId?: string;
  customerId?: string;
  addressId?: string;
  serviceId?: string;
  notes?: string;
};

export function BookingForm({
  customers,
  services,
  prefill,
}: {
  customers: FormCustomer[];
  services: FormService[];
  prefill?: BookingPrefill;
}) {
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
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState(prefill?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function onCustomerChange(id: string) {
    setCustomerId(id);
    const c = customers.find((x) => x.id === id);
    setAddressId(c?.addresses.find((a) => a.is_default)?.id ?? c?.addresses[0]?.id ?? "");
  }

  async function submit() {
    setPending(true);
    setError(null);
    const result = await createBooking({
      customer_id: customerId,
      service_address_id: addressId,
      service_id: serviceId || "",
      quote_id: prefill?.quoteId || "",
      recurrence,
      scheduled_start: start,
      scheduled_end: end,
      notes,
    });
    setPending(false);
    if (result?.error) setError(result.error);
    // Success redirects to the booking detail page.
  }

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField id="bk-customer" label="Customer" value={customerId} onChange={(e) => onCustomerChange(e.target.value)}>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </SelectField>
        <div>
          <SelectField id="bk-address" label="Service address" value={addressId} onChange={(e) => setAddressId(e.target.value)}>
            {(customer?.addresses ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}: {a.address_line1}, {a.city}
              </option>
            ))}
          </SelectField>
          {(customer?.addresses ?? []).length === 0 && (
            <p className="mt-1 text-xs text-red-600">This customer has no addresses yet — add one on their profile.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField id="bk-service" label="Service" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          <option value="">—</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </SelectField>
        <SelectField id="bk-recurrence" label="Repeats" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
          <option value="none">One time</option>
          <option value="weekly">Weekly (next 8 visits)</option>
          <option value="biweekly">Every 2 weeks (next 8 visits)</option>
          <option value="monthly">Monthly (next 6 visits)</option>
        </SelectField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="bk-start" label="Start" type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} />
        <Field id="bk-end" label="End" type="datetime-local" required value={end} onChange={(e) => setEnd(e.target.value)} />
      </div>

      <TextareaField id="bk-notes" label="Notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the crew should know…" />

      <Button onClick={submit} disabled={pending || !customerId || !addressId || !start || !end} className="w-full sm:w-auto">
        {pending ? "Creating…" : "Create booking"}
      </Button>
    </div>
  );
}
