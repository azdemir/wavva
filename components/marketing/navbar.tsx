import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getSessionUser } from "@/lib/auth";

const links = [
  { label: "Features", href: "/features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
];

export async function Navbar() {
  const user = await getSessionUser();

  const actions = user ? (
    <>
      <Button href="/dashboard" size="sm">
        Go to dashboard
      </Button>
    </>
  ) : (
    <>
      <Button href="/signin" variant="ghost" size="sm">
        Sign in
      </Button>
      <Button href="/demo" size="sm">
        Start free trial
      </Button>
    </>
  );

  const mobileActions = user ? (
    <Button href="/dashboard" size="sm" className="w-full">
      Go to dashboard
    </Button>
  ) : (
    <>
      <Button href="/signin" variant="outline" size="sm" className="w-full">
        Sign in
      </Button>
      <Button href="/demo" size="sm" className="w-full">
        Start free trial
      </Button>
    </>
  );
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <Container>
        <nav
          aria-label="Primary"
          className="flex h-16 items-center justify-between"
        >
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 hover:text-slate-900 dark:hover:text-white dark:text-slate-100"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            {actions}
          </div>

          {/* Mobile: theme toggle + no-JS menu */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 [&::-webkit-details-marker]:hidden">
                Menu
              </summary>
            <div className="absolute top-12 right-0 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 space-y-2 border-t border-slate-200 dark:border-slate-800 pt-2">
                {mobileActions}
              </div>
            </div>
          </details>
          </div>
        </nav>
      </Container>
    </header>
  );
}
