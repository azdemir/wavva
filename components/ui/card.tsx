import type { HTMLAttributes, ReactNode } from "react";

type DivProps = HTMLAttributes<HTMLDivElement>;

function cx(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Card({ className, ...rest }: DivProps) {
  return (
    <div
      className={cx(
        "rounded-[20px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({
  className,
  ...rest
}: DivProps) {
  return <div className={cx("p-6 pb-0", className)} {...rest} />;
}

export function CardTitle({
  className,
  ...rest
}: DivProps) {
  return (
    <h3
      className={cx("text-lg font-semibold text-slate-900 dark:text-slate-100", className)}
      {...rest}
    />
  );
}

export function CardDescription({
  className,
  ...rest
}: DivProps) {
  return (
    <p className={cx("mt-1 text-sm text-slate-500 dark:text-slate-400", className)} {...rest} />
  );
}

export function CardContent({
  className,
  ...rest
}: DivProps) {
  return <div className={cx("p-6", className)} {...rest} />;
}

export function CardFooter({
  className,
  ...rest
}: DivProps) {
  return (
    <div
      className={cx(
        "flex items-center gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50",
        className,
      )}
      {...rest}
    />
  );
}

export function CardIcon({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
      {children}
    </div>
  );
}
