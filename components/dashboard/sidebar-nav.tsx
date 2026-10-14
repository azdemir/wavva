"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  soon?: boolean;
  soonLabel?: string;
};

/** Switchboard sidebar nav — pill items with violet active state. */
export function SidebarNav({ items }: { items: SidebarNavItem[] }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  return (
    <nav className="space-y-1" aria-label="Workspace">
      {items.map((item) => {
        const active = isActive(item.href);
        const cls = `flex items-center gap-3 rounded-full px-4 py-2.5 font-sb text-sm font-semibold transition-all duration-200 ${
          active
            ? "bg-sb-violet-soft text-sb-violet-dark shadow-sm dark:bg-sb-violet dark:text-white"
            : "text-slate-600 hover:bg-sb-violet-soft/60 hover:text-sb-violet-dark dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        }`;
        const content = (
          <>
            <span className="shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.soon && (
              <Badge tone="slate" className="text-[10px]">
                {item.soonLabel}
              </Badge>
            )}
          </>
        );
        return item.soon ? (
          <span key={item.href} className={`${cls} cursor-not-allowed opacity-60`} title={item.soonLabel}>
            {content}
          </span>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={cls}
            aria-current={active ? "page" : undefined}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
