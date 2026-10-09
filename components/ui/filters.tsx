import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Field } from "@/components/ui/input";
import { statusLabel } from "@/components/ui/badge";
import { DownloadIcon } from "@/components/ui/icons";

const pillBase =
  "inline-flex min-h-9 items-center rounded-full px-3.5 py-1.5 text-sm font-medium capitalize";
const pillActive = "bg-brand-600 text-white";
const pillIdle =
  "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800";

export type PillOption = { value: string; label?: string };

/**
 * Status filter pills. Links to `basePath` with `param=value` (or no param
 * for "all"), preserving the other params in `preserve`.
 */
export function FilterPills({
  basePath,
  param,
  options,
  current,
  preserve = {},
}: {
  basePath: string;
  param: string;
  options: PillOption[];
  current: string;
  preserve?: Record<string, string | undefined>;
}) {
  const kept = Object.entries(preserve).filter(([, v]) => v !== undefined);
  const hrefFor = (value: string) => {
    const sp = new URLSearchParams();
    for (const [k, v] of kept) if (v !== undefined) sp.set(k, v);
    if (value !== "all") sp.set(param, value);
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Link
          key={o.value}
          href={hrefFor(o.value)}
          className={`${pillBase} ${current === o.value ? pillActive : pillIdle}`}
        >
          {o.label ?? statusLabel(o.value)}
        </Link>
      ))}
    </div>
  );
}

/**
 * Download link for the Excel export API. A plain anchor (not Next Link) so
 * the browser handles the Content-Disposition: attachment download.
 */
export async function ExportButton({ href }: { href: string }) {
  const t = await getTranslations("common");
  return (
    <a
      href={href}
      className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <DownloadIcon className="h-4 w-4" />
      {t("actions.exportExcel")}
    </a>
  );
}

/**
 * GET search form that preserves the other active filters via hidden inputs,
 * so searching never resets the status pills.
 */
export function FilterSearch({
  id,
  name = "q",
  label,
  defaultValue,
  placeholder,
  preserve = {},
}: {
  id: string;
  name?: string;
  label: string;
  defaultValue: string;
  placeholder: string;
  preserve?: Record<string, string | undefined>;
}) {
  return (
    <form method="get" className="w-full max-w-sm">
      {Object.entries(preserve).map(
        ([k, v]) =>
          v !== undefined && <input key={k} type="hidden" name={k} value={v} />,
      )}
      <Field
        id={id}
        name={name}
        label={label}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </form>
  );
}
