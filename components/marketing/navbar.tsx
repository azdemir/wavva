import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { StickyHeader } from "@/components/marketing/sticky-header";
import { FeaturesMenu } from "@/components/marketing/features-menu";
import { MobileNav } from "@/components/marketing/mobile-nav";
import { getSessionUser } from "@/lib/auth";
import { getContent } from "@/lib/studio/content";

const links = [
  { label: "Front Office", href: "/front-office" },
  { label: "How it works", href: "/front-office#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/faq" },
];

/**
 * Desktop (lg+): full labels. Rendered twice for the two breakpoints —
 * Tailwind can't flip a whole component tree, and the label text is tiny.
 */
async function AuthNavActions() {
  // Force dynamic: read cookies unconditionally so this boundary streams
  // even when Supabase isn't configured at build time.
  await cookies();
  const user = await getSessionUser();
  const href = user ? "/dashboard" : "/demo";
  const label = user ? "Dashboard" : "Start free trial";
  return (
    <>
      <span className="hidden lg:inline-flex">
        {user ? null : (
          <Button href="/signin" variant="ghost" size="sm" className="rounded-full">
            Sign in
          </Button>
        )}
      </span>
      <span className="hidden lg:inline-flex">
        <Button href={href} size="sm" className="rounded-full px-5">
          {label}
        </Button>
      </span>
      {/* md–lg: shorten to "Trial" so the row fits tablet widths, and keep a
          40px touch target. */}
      <span className="inline-flex lg:hidden">
        <Button href={href} size="sm" className="h-10 rounded-full px-4">
          {user ? "Dashboard" : "Trial"}
        </Button>
      </span>
    </>
  );
}

async function MobileAuthNavActions() {
  await cookies();
  const user = await getSessionUser();
  if (user) {
    return (
      <Button href="/dashboard" size="sm" className="w-full rounded-full">
        Go to dashboard
      </Button>
    );
  }
  return (
    <>
      <Button
        href="/signin"
        variant="outline"
        size="sm"
        className="w-full rounded-full"
      >
        Sign in
      </Button>
      <Button href="/demo" size="sm" className="w-full rounded-full">
        Start free trial
      </Button>
    </>
  );
}

function ActionsFallback() {
  return (
    <span
      className="inline-flex h-10 w-28 animate-pulse rounded-full bg-surface-3"
      aria-hidden="true"
    />
  );
}

export async function Navbar() {
  const siteName = await getContent<string>("site.name");
  return (
    <StickyHeader>
      <Container>
        <nav
          aria-label="Primary"
          className="flex h-[4.5rem] items-center justify-between"
        >
          <Link href="/" className="-ml-1 rounded-lg p-1">
            <Logo wordmark={siteName} markClassName="h-7 w-7" />
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
            <FeaturesMenu />
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-3.5 py-2 text-[0.9375rem] font-medium text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink dark:hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Everything right of the wordmark is one auto-margin group, so the
              CTA stays pinned to the right edge at every width — a hidden
              link row must never leave it stranded mid-bar. */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
            <Suspense fallback={<ActionsFallback />}>
              <AuthNavActions />
            </Suspense>

            {/* Mobile / tablet: theme toggle + menu with Features accordion */}
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              <MobileNav>
                <Suspense fallback={null}>
                  <MobileAuthNavActions />
                </Suspense>
              </MobileNav>
            </div>
          </div>
        </nav>
      </Container>
    </StickyHeader>
  );
}
