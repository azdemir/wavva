import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  labelExtra?: ReactNode;
};

/**
 * Accessible labeled form field with hint and error states.
 * `error` renders with role="alert" and links via aria-describedby.
 */
export function Field({
  id,
  label,
  hint,
  error,
  labelExtra,
  className = "",
  ...rest
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
        {labelExtra}
      </div>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-1.5 block h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-offset-1 ${
          error
            ? "border-red-400 focus:outline-red-600"
            : "border-slate-300 focus:outline-brand-600"
        } ${className}`}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

/** Accessible labeled textarea with hint and error states. */
export function TextareaField({
  id,
  label,
  hint,
  error,
  className = "",
  rows = 4,
  ...rest
}: TextareaFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-1.5 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-offset-1 ${
          error
            ? "border-red-400 focus:outline-red-600"
            : "border-slate-300 focus:outline-brand-600"
        } ${className}`}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
