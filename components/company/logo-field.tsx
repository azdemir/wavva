"use client";

/**
 * Company logo picker: optional file input with a preview of the current
 * logo and (in Settings) a remove checkbox. Strings are passed in so the
 * same field works in the onboarding and settings namespaces.
 */
export function LogoField({
  inputId,
  label,
  optionalLabel,
  hint,
  previewUrl,
  previewAlt,
  removeLabel,
}: {
  inputId: string;
  label: string;
  optionalLabel: string;
  hint: string;
  previewUrl: string | null;
  previewAlt: string;
  /** When provided, renders a "remove the current logo" checkbox. */
  removeLabel?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
        <span className="text-xs text-slate-400 dark:text-slate-500">{optionalLabel}</span>
      </div>
      {previewUrl && (
        <div className="mt-2 flex items-center gap-3">
          <img
            src={previewUrl}
            alt={previewAlt}
            className="h-12 w-auto max-w-48 rounded-lg border border-slate-200 bg-white object-contain px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      )}
      <input
        id={inputId}
        name="logo"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3.5 file:py-2.5 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-50 dark:text-slate-300 dark:file:border-slate-700 dark:file:bg-slate-900 dark:file:text-slate-200 dark:hover:file:bg-slate-800"
      />
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      {previewUrl && removeLabel && (
        <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="remove_logo"
            value="1"
            className="h-5 w-5 rounded accent-brand-600"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">{removeLabel}</span>
        </label>
      )}
    </div>
  );
}
