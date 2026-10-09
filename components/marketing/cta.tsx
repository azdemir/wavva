import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Container } from "@/components/ui/container";
import { Ambient } from "@/components/marketing/ambient";
import { ArrowRightIcon } from "@/components/ui/icons";
import { getSessionUser } from "@/lib/auth";
import { getContent } from "@/lib/studio/content";

/** Session-aware CTA button. Streams in after the static shell. */
async function CtaButton() {
  await cookies();
  const user = await getSessionUser();
  return (
    <Link
      href={user ? "/dashboard" : "/demo"}
      className="group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold whitespace-nowrap text-night shadow-[0_18px_50px_-18px_rgba(255,255,255,0.5)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {user ? "Go to dashboard" : "Start free trial"}
      <ArrowRightIcon className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

export async function Cta() {
  const [title, body, siteName, siteEmail, trialNote] = await Promise.all([
    getContent<string>("home.cta.title"),
    getContent<string>("home.cta.body"),
    getContent<string>("site.name"),
    getContent<string>("site.email"),
    getContent<string>("home.hero.trial_note"),
  ]);

  // The body default mentions the product name; keep it in sync when the
  // name is customized but the body still carries the default text.
  const renderedBody = body.replace("TidyPro", siteName);

  return (
    <section
      id="contact"
      className="relative scroll-mt-24 overflow-hidden bg-night py-24 sm:py-28 lg:py-32"
    >
      <Ambient tone="dark" />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-[2.25rem] leading-[1.02] tracking-[-0.025em] text-balance text-white sm:text-6xl lg:text-[4.25rem]">
            {title}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-white/60">
            {renderedBody}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Suspense
              fallback={
                <span
                  className="inline-flex h-13 w-48 animate-pulse rounded-full bg-white/20"
                  aria-hidden="true"
                />
              }
            >
              <CtaButton />
            </Suspense>
            <Link
              href={`mailto:${siteEmail}`}
              className="inline-flex h-13 items-center justify-center rounded-full border border-white/20 px-8 text-base font-semibold whitespace-nowrap text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Talk to us
            </Link>
          </div>

          <p className="mt-7 font-mono text-[11px] tracking-[0.14em] text-white/35 uppercase">
            {trialNote
              .split("·")
              .map((p) => p.trim())
              .filter(Boolean)
              .join("  ·  ")}
          </p>
        </div>
      </Container>
    </section>
  );
}