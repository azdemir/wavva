"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/input";
import {
  AddressAutocomplete,
  type ParsedAddress,
} from "@/components/customers/address-autocomplete";
import { createAddress } from "@/lib/actions/customers";

export function AddressForm({ customerId }: { customerId: string }) {
  const t = useTranslations("customers");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  // Controlled so a picked Google suggestion can fill them in.
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t("addressForm.addAddress")}
      </Button>
    );
  }

  const handleSelect = (addr: ParsedAddress) => {
    if (addr.city) setCity(addr.city);
    if (addr.state) setState(addr.state);
    if (addr.zip) setZip(addr.zip);
  };

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await createAddress(formData);
        setPending(false);
        if (result?.error) setError(result.error);
        else setOpen(false);
      }}
      className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
    >
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <input type="hidden" name="customer_id" value={customerId} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="addr-label" name="label" label={t("addressForm.labelLabel")} defaultValue={t("addressForm.labelDefault")} placeholder={t("addressForm.labelPlaceholder")} />
        <div className="sm:col-span-2">
          <AddressAutocomplete
            id="addr-line1"
            name="address_line1"
            label={t("addressForm.streetLabel")}
            required
            placeholder={t("addressForm.streetPlaceholder")}
            onSelect={handleSelect}
          />
        </div>
      </div>
      <Field id="addr-line2" name="address_line2" label={t("addressForm.aptLabel")} placeholder={t("addressForm.aptPlaceholder")} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          id="addr-city"
          name="city"
          label={t("addressForm.cityLabel")}
          required
          placeholder={t("addressForm.cityPlaceholder")}
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <Field
          id="addr-state"
          name="state"
          label={t("addressForm.stateLabel")}
          required
          placeholder={t("addressForm.statePlaceholder")}
          value={state}
          onChange={(e) => setState(e.target.value)}
        />
        <Field
          id="addr-zip"
          name="zip"
          label={t("addressForm.zipLabel")}
          required
          placeholder={t("addressForm.zipPlaceholder")}
          value={zip}
          onChange={(e) => setZip(e.target.value)}
        />
      </div>
      <TextareaField
        id="addr-access"
        name="access_instructions"
        label={t("addressForm.accessLabel")}
        rows={2}
        placeholder={t("addressForm.accessPlaceholder")}
      />
      <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" name="is_default" className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 dark:text-brand-400" />
        {t("addressForm.defaultAddress")}
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? t("addressForm.saving") : t("addressForm.saveAddress")}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          {t("addressForm.cancel")}
        </Button>
      </div>
    </form>
  );
}
