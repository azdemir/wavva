import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";

const links = [
  { label: "Features", href: "/features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur">
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
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Button href="/signin" variant="ghost" size="sm">
              Sign in
            </Button>
            <Button href="/demo" size="sm">
              Start free trial
            </Button>
          </div>

          {/* No-JS mobile menu */}
          <details className="relative md:hidden">
            <summary className="cursor-pointer list-none rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute top-12 right-0 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 space-y-2 border-t border-slate-200 pt-2">
                <Button href="/signin" variant="outline" size="sm" className="w-full">
                  Sign in
                </Button>
                <Button href="/demo" size="sm" className="w-full">
                  Start free trial
                </Button>
              </div>
            </div>
          </details>
        </nav>
      </Container>
    </header>
  );
}
