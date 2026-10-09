import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/admin";
import { signOut } from "@/lib/actions/auth";
import { LogoMark } from "@/components/ui/logo";

export const instant = false;

const NAV = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/analytics", label: "Analytics" },
  { href: "/studio/website", label: "Website" },
  { href: "/studio/crm", label: "CRM" },
  { href: "/studio/users", label: "Users" },
];

/**
 * TidyPro Studio — the founder/dev HQ. No-code website editor + CRM for the
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link href="/studio" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              TidyPro{" "}
              <span className="font-normal text-slate-500 dark:text-slate-400">
                Studio
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-1" aria-label="Studio">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
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
                className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
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
