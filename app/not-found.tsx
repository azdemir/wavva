import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you're looking for doesn't exist.",
};

/** Custom 404 — friendly, on-brand, with a way home. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <Container>
          <div className="flex h-16 items-center">
            <Link href="/" aria-label="Wavva home" className="inline-flex min-h-11 items-center">
              <Logo />
            </Link>
          </div>
        </Container>
      </header>

      <main className="flex flex-1 items-center">
        <Container>
          <div className="mx-auto max-w-lg py-20 text-center">
            <p className="text-sm font-semibold tracking-wide text-brand-600 uppercase dark:text-brand-400">
              404
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              This page took a day off
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              The link you followed doesn&apos;t exist or was moved. Let&apos;s
              get you back to work.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/" size="lg">
                Go to homepage
              </Button>
              <Button href="/dashboard" variant="outline" size="lg">
                Open dashboard
              </Button>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
