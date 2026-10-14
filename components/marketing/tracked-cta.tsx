"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

/**
 * CTA link that records a cta_click analytics event before navigating.
 * Variant/size props pass through to the shared Button.
 */
export function TrackedCta({
  href,
  cta,
  page,
  variant = "primary",
  size = "lg",
  className = "",
  children,
}: {
  href: string;
  cta: string;
  page: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      href={href}
      variant={variant}
      size={size}
      className={className}
      onClick={() => track("cta_click", { cta, page })}
    >
      {children}
    </Button>
  );
}

/** Plain text link variant for in-copy CTAs. */
export function TrackedLink({
  href,
  cta,
  page,
  className = "",
  children,
}: {
  href: string;
  cta: string;
  page: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => track("cta_click", { cta, page })}
    >
      {children}
    </Link>
  );
}
