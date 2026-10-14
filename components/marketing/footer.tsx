import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { getContent } from "@/lib/studio/content";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Front Office Service", href: "/front-office" },
      { label: "Claim a founding spot", href: "/founding-client" },
      { label: "Features", href: "/features" },
      { label: "How it works", href: "/front-office#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Compare", href: "/compare" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Start free trial", href: "/demo" },
      { label: "Sign in", href: "/signin" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export async function Footer() {
  const [siteName, tagline] = await Promise.all([
    getContent<string>("site.name"),
    getContent<string>("site.tagline"),
  ]);
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <Container>
        <div className="grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
<Logo wordmark={siteName} />
            </div>
            <p className="mt-4 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {tagline}. Quotes, scheduling, teams, invoices, and
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
            © 2026 {siteName}. All rights reserved.
          </p>
          <p className="text-center text-sm text-slate-400">
            Proudly locally owned in Upstate New York · Made for cleaning businesses here.
          </p>
        </div>
      </Container>
    </footer>
  );
}
