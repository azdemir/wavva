"use client";

import { useCallback, useRef, type ReactNode } from "react";

/**
 * Card that lights up under the cursor.
 *
 * The pointer position is written to two CSS custom properties and consumed
 * by a single radial-gradient background — no per-move React state, so
 * scrolling and hovering stay cheap. Falls back to a plain static surface on
 * touch devices (no pointer to follow).
 */
export function SpotlightCard({
  children,
  className = "",
  radius = "26rem",
}: {
  children: ReactNode;
  className?: string;
  radius?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "touch") return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      el.style.setProperty("--my", `${e.clientY - rect.top}px`);
    },
    [],
  );

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={`group/card relative h-full overflow-hidden bg-surface transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 ${className}`}
      style={
        {
          backgroundImage: `radial-gradient(${radius} circle at var(--mx, 50%) var(--my, 0%), color-mix(in oklab, var(--color-brand-500) 9%, transparent), transparent 70%)`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}