import type { Metadata } from "next";
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/admin";
import { signOut } from "@/lib/actions/auth";
import { LogoMark } from "@/components/ui/logo";

export const instant = false;

// Internal founder tooling: never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/analytics", label: "Analytics" },
  { href: "/studio/website", label: "Website" },
  { href: "/studio/crm", label: "CRM" },
  { href: "/studio/users", label: "Users" },
  { href: "/studio/tiers", label: "Tiers" },
];

/**
 * Wavva Studio — the founder/dev HQ. No-code website editor + CRM for the
 * SaaS itself. Gated by the platform-admin email allowlist, deliberately
 * separate from both the company dashboard and the /admin ops view.
 */
export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-sb-bg2 font-sb dark:bg-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <Link href="/studio" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="font-sb text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Wavva{" "}
              <span className="font-semibold text-sb-violet-dark dark:text-sb-violet">
                Studio
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-1" aria-label="Studio">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-2 font-sb text-sm font-semibold text-slate-600 transition-all hover:bg-sb-violet-soft hover:text-sb-violet-dark dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="rounded-full px-3.5 py-2 font-sb text-sm font-semibold text-slate-600 transition-all hover:bg-sb-violet-soft hover:text-sb-violet-dark dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              Platform admin
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-500 sm:inline dark:text-slate-400">
              {user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full bg-sb-violet-soft px-4 py-2 font-sb text-sm font-bold text-sb-violet-dark transition-all hover:bg-sb-violet hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
