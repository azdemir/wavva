"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

export type ParsedAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

type Props = {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  /** Called with parsed components when the user picks a suggestion. */
  onSelect?: (addr: ParsedAddress) => void;
};

let placesPromise: Promise<typeof google.maps.places> | null = null;

function loadPlaces(apiKey: string) {
  if (!placesPromise) {
    setOptions({ key: apiKey, v: "weekly" });
    placesPromise = importLibrary("places");
  }
  return placesPromise;
}

function parseComponents(
  components: google.maps.GeocoderAddressComponent[],
): ParsedAddress {
  const get = (type: string, useShort = false) =>
    components.find((c) => c.types.includes(type))?.[
      useShort ? "short_name" : "long_name"
    ] ?? "";
  const streetNumber = get("street_number");
  const route = get("route");
  return {
    street: [streetNumber, route].filter(Boolean).join(" "),
    city: get("locality") || get("sublocality") || get("administrative_area_level_2"),
    state: get("administrative_area_level_1", true),
    zip: get("postal_code"),
  };
}

/**
 * Street-address input with Google Places autocomplete. When the user picks
 * a suggestion, address components are parsed and handed to `onSelect` so
 * the parent can fill city/state/ZIP. Degrades to a plain text input when
 * no API key is configured or the API fails to load.
 */
export function AddressAutocomplete({
  id,
  name,
  label,
  required,
  placeholder,
  defaultValue,
  onSelect,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !inputRef.current || !onSelect) return;
    let autocomplete: google.maps.places.Autocomplete | null = null;
    let cancelled = false;

    loadPlaces(apiKey)
      .then((places) => {
        if (cancelled || !inputRef.current) return;
        autocomplete = new places.Autocomplete(inputRef.current, {
          types: ["address"],
          // Bias toward the US; remove componentRestrictions to go worldwide.
          componentRestrictions: { country: "us" },
          fields: ["address_components", "formatted_address"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete?.getPlace();
          const components = place?.address_components;
          if (components?.length) {
            onSelect(parseComponents(components));
          }
        });
        setReady(true);
      })
      .catch(() => {
        // Silently degrade to a plain input.
      });

    return () => {
      cancelled = true;
      if (autocomplete) google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [apiKey, onSelect]);

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-offset-1 focus:outline-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
      {apiKey && !ready && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
          Loading address suggestions…
        </p>
      )}
    </div>
  );
}
