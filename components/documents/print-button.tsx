"use client";

import { PrinterIcon } from "@/components/ui/icons";

/** Calls the browser print dialog — the user can print or save as PDF. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <PrinterIcon className="h-4 w-4" />
      Print / Save as PDF
    </button>
  );
}
