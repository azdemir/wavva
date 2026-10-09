import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type Variant = "primary" | "accent" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-[0_1px_2px_rgba(15,23,42,0.12),0_8px_24px_-12px_rgba(37,99,235,0.7)] hover:bg-brand-700 active:bg-brand-800 focus-visible:outline-brand-600",
  accent:
    "bg-accent-600 text-white shadow-[0_1px_2px_rgba(15,23,42,0.12),0_8px_24px_-12px_rgba(22,163,74,0.7)] hover:bg-accent-700 active:bg-accent-800 focus-visible:outline-accent-600",
  outline:
    "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800",
  ghost:
    "text-brand-700 hover:bg-brand-50 focus-visible:outline-brand-600 dark:text-brand-400 dark:hover:bg-brand-950",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:outline-red-600",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
  xl: "h-14 px-8 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsLink = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * Primary action control. Renders a Next.js Link when `href` is provided,
 * otherwise a native <button>. Server-component safe.
 *
 * NOTE: `variant`, `size`, `className`, `children`, and `href` are consumed
 * here and never spread onto the DOM element — spreading them after
 * `className` would let e.g. `className="w-full"` clobber the base styles.
 */
export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className = "",
    children,
    href,
    ...rest
  } = props;

  const cls = [
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap",
    "transition-[color,background-color,border-color,box-shadow,transform] duration-200",
    "active:scale-[0.98]",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    variantStyles[variant],
    sizeStyles[size],
    className,
  ].join(" ");

  if (href) {
    return (
      <Link
        href={href}
        className={cls}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={cls}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
