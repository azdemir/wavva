"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/actions/auth";

export type UserBarNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  soon?: boolean;
};

export type UserBarUser = {
  companyName: string;
  email: string;
  roleLabel: string;
  planName: string;
};

export type UserBarLabels = {
  account: string;
  signOut: string;
  websiteHome: string;
  backHomeLabel: string;
  soon: string;
  comingSoon: string;
  mainNav: string;
  openMenu: string;
};

/**
 * Slim dashboard top bar: user controls only — profile menu, language
 * switcher, and light/dark toggle. Primary navigation lives in the left
 * sidebar; on small screens the hamburger button opens it as a menu.
 */
export function DashboardUserBar({
  items,
  user,
  labels,
}: {
  items: UserBarNavItem[];
  user: UserBarUser;
  labels: UserBarLabels;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  // Close the user dropdown on outside click / Escape.
  useEffect(() => {
    if (!userOpen) return;
    const onDown = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [userOpen]);

  // Links and the sign-out form navigate away — close any open menu first.
  const closeMenus = () => {
    setUserOpen(false);
    setMenuOpen(false);
  };

  const linkCls = (active: boolean) =>
    `flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    }`;

  const initials = user.companyName.trim().slice(0, 2).toUpperCase() || "TP";

  const renderItem = (item: UserBarNavItem) => {
    const content = (
      <>
        {item.icon}
        <span className="flex-1">{item.label}</span>
        {item.soon && (
          <Badge tone="slate" className="text-[10px]">
            {labels.soon}
          </Badge>
        )}
      </>
    );
    const cls = `${linkCls(isActive(item.href))} w-full`;
    return item.soon ? (
      <span key={item.href} className={`${cls} cursor-not-allowed opacity-60`} title={labels.comingSoon}>
        {content}
      </span>
    ) : (
      <Link key={item.href} href={item.href} className={cls} onClick={closeMenus} aria-current={isActive(item.href) ? "page" : undefined}>
        {content}
      </Link>
    );
  };

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex h-12 items-center gap-1 px-4 md:px-8">
        <button
          type="button"
          className="mr-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
          aria-label={labels.openMenu}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
        <Link href="/dashboard" className="flex shrink-0 items-center md:hidden" aria-label={labels.mainNav}>
          <Logo />
        </Link>
        <Link
          href="/"
          aria-label={labels.backHomeLabel}
          className="ml-1 hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 md:flex"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 3 3 10h3v7h4v-5h4v5h4v-7h3L10 3z" />
          </svg>
          {labels.websiteHome}
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <LocaleSwitcher />
          <ThemeToggle className="h-9 w-9" />
          <div ref={userRef} className="relative">
            <button
              type="button"
              onClick={() => setUserOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={userOpen}
              aria-label={labels.account}
              title={labels.account}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 transition hover:bg-slate-100 dark:hover:bg-slate-800 sm:pr-2"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white"
              >
                {initials}
              </span>
              <span className="hidden text-left xl:block">
                <span className="block max-w-36 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {user.companyName}
                </span>
                <span className="block max-w-36 truncate text-xs text-slate-500 dark:text-slate-400">
                  {user.email}
                </span>
              </span>
              <svg className="hidden h-4 w-4 text-slate-400 sm:block" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {userOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {user.companyName}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="slate">{user.roleLabel}</Badge>
                    <Badge tone="slate">{user.planName}</Badge>
                  </div>
                </div>
                <div className="p-1.5">
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      {labels.signOut}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {menuOpen && (
        <nav className="border-t border-slate-200 dark:border-slate-800 md:hidden" aria-label={labels.mainNav}>
          <div className="space-y-0.5 px-4 py-3">
            {[
              {
                href: "/",
                label: labels.websiteHome,
                icon: (
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 3 3 10h3v7h4v-5h4v5h4v-7h3L10 3z" />
                  </svg>
                ),
              } satisfies UserBarNavItem,
              ...items,
            ].map((item) => renderItem(item))}
          </div>
        </nav>
      )}
    </header>
  );
}
