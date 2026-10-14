import Link from "next/link";
import { SwitchboardLogo } from "./logo";

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "How it works", href: "/#how" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQs", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Founding 50", href: "/#trial" },
      { label: "Start trial", href: "/#trial" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "AI disclosure", href: "/faq" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden rounded-t-[40px] bg-sb-ink pb-8 pt-16 text-[#a9a9c9]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 130%, rgba(109,92,255,0.35), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-[1200px] px-7">
        <div className="mb-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <SwitchboardLogo light />
            <p className="mt-4 max-w-xs font-sb text-sm leading-relaxed">
              The AI front office for every business. Every call answered. Every business.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <h4 className="mb-4 font-sb text-sm font-bold tracking-wide text-white">
                {c.title}
              </h4>
              {c.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="mb-2.5 block font-sb text-sm transition-colors hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 font-sb text-[13px]">
          <span>© 2026 Switchboard</span>
          <span>Every call answered. Every business.</span>
        </div>
      </div>
    </footer>
  );
}
