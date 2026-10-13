import Link from "next/link";
import { Container } from "@/components/ui/container";
import { LogoMark } from "@/components/ui/logo";
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
      { label: "Contact", href: "/contact" },
      { label: "Start free trial", href: "/demo" },
      { label: "Sign in", href: "/signin" },
    ],
  },
];

export async function Footer() {
  const [siteName, tagline] = await Promise.all([
    getContent<string>("site.name"),
    getContent<string>("site.tagline"),
  ]);

  return (
    <footer className="relative overflow-hidden border-t border-night-line bg-night text-white">
      <Container className="relative">
        <div className="grid gap-12 py-16 md:grid-cols-[1.6fr_1fr_1fr] lg:py-20">
          <div>
            {/* Logo hardcodes an ink wordmark, so the always-dark footer
                renders the mark + wordmark itself rather than inheriting a
                near-invisible dark-grey wordmark. */}
            <span className="inline-flex items-center gap-2.5">
              <LogoMark className="h-7 w-7" />
              <span className="text-lg font-bold tracking-tight text-white">
                {siteName.endsWith("Pro") ? (
                  <>
                    {siteName.slice(0, -3)}
                    <span className="text-brand-400">Pro</span>
                  </>
                ) : (
                  siteName
                )}
              </span>
            </span>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
              {tagline}. Quotes, scheduling, teams, invoices, and customers —
              in one simple workspace for every cleaning company.
            </p>

            <a
              href="#top"
              className="mt-4 inline-flex min-h-11 items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-white/40 uppercase transition-colors hover:text-white"
            >
              Back to top
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
              </svg>
            </a>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="font-mono text-[11px] font-medium tracking-[0.14em] text-white/40 uppercase">
                {col.title}
              </h3>
              <ul className="mt-2 space-y-1">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="inline-flex min-h-11 items-center text-sm text-white/65 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Oversized wordmark — the last thing you see, and the thing that
            gets remembered.
            Fixed-height band with the glyphs hung from the top edge, so only
            their shoulders show. A negative margin here would drag the
            copyright bar up into the wordmark on short viewports. */}
        <div
          aria-hidden="true"
          className="pointer-events-none relative mt-6 h-16 overflow-hidden select-none sm:h-24"
        >
          <p className="absolute inset-x-0 -top-[0.16em] bg-gradient-to-b from-white/[0.09] to-transparent bg-clip-text text-center font-display text-[24vw] leading-[0.72] tracking-[-0.04em] text-transparent">
            {siteName}
          </p>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-night-line py-7 sm:flex-row">
          <p className="text-sm text-white/40">
            © 2026 {siteName}. All rights reserved.
          </p>
          <p className="text-center text-sm text-white/40">
            Proudly locally owned in Upstate New York · Made for cleaning
            businesses here.
          </p>
        </div>
      </Container>
    </footer>
  );
}