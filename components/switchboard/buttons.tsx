"use client";

import { useEffect, useRef, type ReactNode, type MouseEvent } from "react";
import Link from "next/link";

type BtnProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "dark" | "light" | "white";
  size?: "sm" | "md" | "lg";
  className?: string;
  magnetic?: boolean;
  /** When provided, runs instead of the default anchor navigation. */
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

const variants: Record<string, string> = {
  primary: "bg-sb-violet text-white hover:shadow-[0_16px_34px_rgba(109,92,255,0.42)]",
  dark: "bg-sb-ink text-white hover:shadow-[0_16px_34px_rgba(20,20,43,0.35)]",
  light: "bg-white text-sb-ink border-[1.5px] border-sb-ink/10 hover:shadow-[0_14px_30px_rgba(20,20,43,0.12)]",
  white: "bg-white text-sb-violet-dark hover:shadow-[0_16px_34px_rgba(0,0,0,0.25)]",
};

const sizes: Record<string, string> = {
  sm: "px-6 py-3 text-sm",
  md: "px-8 py-4 text-[15.5px]",
  lg: "px-10 py-[18px] text-[17px]",
};

/**
 * Wavva button — pill, magnetic hover, shine sweep.
 * Mirrors the tracked-cta analytics contract via data attributes.
 */
export function SbButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
  magnetic = true,
  onClick,
}: BtnProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !magnetic || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (e: globalThis.MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.16}px, ${
        (e.clientY - r.top - r.height / 2) * 0.26
      }px)`;
    };
    const leave = () => {
      el.style.transform = "";
    };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", leave);
    };
  }, [magnetic]);

  return (
    <Link
      ref={ref}
      href={href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        // Analytics hook (mirrors TrackedCta contract).
        (window as unknown as { sbTrack?: (n: string, p: Record<string, string>) => void }).sbTrack?.(
          "cta_click",
          { href }
        );
        // A custom handler takes over navigation (e.g. hash links must scroll
        // on every click — a plain anchor won't re-scroll to an unchanged hash).
        if (onClick) {
          e.preventDefault();
          onClick(e);
        }
      }}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-sb font-bold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${className}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-[80%] w-1/2 -skew-x-[20deg] bg-gradient-to-r from-transparent via-white/40 to-transparent transition-all duration-500 group-hover:left-[130%]"
      />
      <span className="relative">{children}</span>
    </Link>
  );
}
