import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { site } from "@/lib/site";
import { Container } from "@/components/ui/container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { getSessionUser } from "@/lib/auth";

/** Session-aware CTA button. Streams in after the static shell. */
async function CtaButton() {
  await cookies();
  const user = await getSessionUser();
  return (
    <Link
      href={user ? "/dashboard" : "/demo"}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-7 text-base font-semibold whitespace-nowrap text-brand-700 shadow-sm transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {user ? "Go to dashboard" : "Start free trial"}
      <ArrowRightIcon className="h-5 w-5 shrink-0" />
    </Link>
  );
}

export function Cta() {
  return (
    <section id="contact" className="scroll-mt-20 bg-brand-700 py-20 sm:py-24 dark:bg-brand-900">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to spend less time on paperwork?
          </h2>
          <p className="mt-4 text-lg text-brand-100">
            Join the cleaning businesses getting organized with {site.name}.
            Set up in under 30 minutes — your first 14 days are free.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {/* Explicit styles (not Button overrides): on a dark background the
                shared Button variants can't reliably override via className
                because conflicting Tailwind utilities resolve by stylesheet
                order, not class order. */}
            <Suspense
              fallback={
                <span className="inline-flex h-12 w-44 animate-pulse rounded-lg bg-white/20" aria-hidden="true" />
              }
            >
              <CtaButton />
            </Suspense>
            <Link
              href={`mailto:${site.email}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/40 px-7 text-base font-semibold whitespace-nowrap text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
