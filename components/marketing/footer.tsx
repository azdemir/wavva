import Link from "next/link";
import { site } from "@/lib/site";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Start free trial", href: "/demo" },
      { label: "Sign in", href: "/signin" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <Container>
        <div className="grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
<Logo />
            </div>
            <p className="mt-4 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {site.tagline}. Quotes, scheduling, teams, invoices, and
              customers — in one simple workspace for every cleaning company.
            </p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100 uppercase">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="inline-block py-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 py-6 sm:flex-row">
          <p className="text-sm text-slate-400">
            © 2026 {site.name}. All rights reserved.
          </p>
          <p className="text-sm text-slate-400">
            Made for cleaning businesses in Upstate New York.
          </p>
        </div>
      </Container>
    </footer>
  );
}
