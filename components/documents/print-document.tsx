/**
 * Clean, printer-friendly business document (invoice / quote).
 * Uses explicit light colors (no dark: variants) so it prints well
 * regardless of the user's theme. Dashboard chrome is hidden via
 * `@media print` rules in globals.css.
 */

import { getTranslations } from "next-intl/server";
import { getLogoViewUrl } from "@/lib/storage";
import { Logo } from "@/components/ui/logo";

export type PrintCompany = {
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
};

export type PrintCustomer = {
  name: string;
  email: string | null;
  phone: string | null;
};

export type PrintItem = {
  label: string;
  sub?: string;
  qty: string;
  unitPrice: string;
  total: string;
};

export type PrintTotal = {
  label: string;
  value: string;
  strong?: boolean;
};

export async function PrintDocument({
  company,
  kind,
  number,
  status,
  meta,
  customer,
  items,
  totals,
  notes,
  footerNote,
}: {
  company: PrintCompany;
  kind: "Invoice" | "Quote";
  number: string;
  status: string;
  meta: { label: string; value: string }[];
  customer: PrintCustomer;
  items: PrintItem[];
  totals: PrintTotal[];
  notes?: string | null;
  footerNote: string;
}) {
  const t = await getTranslations("quotes");
  const contact = [company.phone, company.email, company.website].filter(Boolean).join(" · ");
  const logoUrl = await getLogoViewUrl(company.logo_url);
  return (
    <div className="mx-auto max-w-3xl bg-white px-8 py-10 text-slate-900 print:max-w-none print:px-0 print:py-0">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-slate-900 pb-6">
        <div>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${company.name} logo`}
              className="mb-3 h-12 w-auto max-w-56 object-contain"
            />
          ) : (
            <div className="mb-3">
              <Logo />
            </div>
          )}
          <p className="text-2xl font-bold tracking-tight">{company.name}</p>
          {contact && <p className="mt-1 text-sm text-slate-600">{contact}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold uppercase tracking-wide">{kind === "Invoice" ? t("document.invoice") : t("document.quote")}</p>
          <p className="mt-1 text-lg font-semibold text-slate-700">{number}</p>
          <p className="mt-1 text-sm text-slate-600">{t("document.status", { status })}</p>
        </div>
      </div>

      {/* Meta + bill-to */}
      <div className="flex flex-wrap justify-between gap-6 py-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("document.billTo")}</p>
          <p className="mt-1 font-semibold">{customer.name}</p>
          {customer.email && <p className="text-sm text-slate-600">{customer.email}</p>}
          {customer.phone && <p className="text-sm text-slate-600">{customer.phone}</p>}
        </div>
        <dl className="space-y-1 text-sm">
          {meta.map((m) => (
            <div key={m.label} className="flex justify-end gap-3">
              <dt className="text-slate-500">{m.label}:</dt>
              <dd className="min-w-28 text-right font-medium">{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Line items */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-slate-300 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2.5 pr-4 font-semibold">{t("document.descriptionCol")}</th>
            <th className="py-2.5 pr-4 text-right font-semibold">{t("document.qtyCol")}</th>
            <th className="py-2.5 pr-4 text-right font-semibold">{t("document.unitPriceCol")}</th>
            <th className="py-2.5 text-right font-semibold">{t("document.totalCol")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((it, i) => (
            <tr key={i}>
              <td className="py-2.5 pr-4">
                {it.label}
                {it.sub && <span className="ml-2 text-xs text-slate-500">{it.sub}</span>}
              </td>
              <td className="py-2.5 pr-4 text-right">{it.qty}</td>
              <td className="py-2.5 pr-4 text-right">{it.unitPrice}</td>
              <td className="py-2.5 text-right font-medium">{it.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-2 flex justify-end">
        <dl className="w-64 space-y-1.5 py-4 text-sm">
          {totals.map((t) => (
            <div
              key={t.label}
              className={`flex justify-between ${t.strong ? "border-t border-slate-300 pt-2 text-base font-bold" : ""}`}
            >
              <dt className={t.strong ? "" : "text-slate-600"}>{t.label}</dt>
              <dd className={t.strong ? "" : "font-medium"}>{t.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {notes && (
        <div className="mt-4 border-t border-slate-200 pt-4 text-sm">
          <p className="font-semibold">{t("document.notesTitle")}</p>
          <p className="mt-1 whitespace-pre-wrap text-slate-700">{notes}</p>
        </div>
      )}

      <p className="mt-10 border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
        {footerNote}
      </p>
    </div>
  );
}
