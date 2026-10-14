import type { Metadata } from "next";
import { Suspense } from "react";
import { PillNav } from "@/components/switchboard/pill-nav";
import { Footer } from "@/components/switchboard/footer";
import { Reveal } from "@/components/switchboard/reveal";
import { Eyebrow, Grad } from "@/components/switchboard/section-head";
import { FoundingClientForm } from "@/components/marketing/founding-client-form";
import { FRONT_OFFICE } from "@/lib/front-office";

export const metadata: Metadata = {
  title: "Claim a founding spot — Wavva",
  description:
    "Apply as a founding client of Wavva: free white-glove setup, founding price locked for 12 months, month to month. 50 spots for local businesses.",
  alternates: { canonical: "/founding-client" },
};

const PERKS = [
  "Free white-glove setup — we train Wavva on your business and move your customer list",
  "Founding price locked for 12 months",
  "Month to month — cancel any month",
  "Your number stays yours; everything goes out under your company's name",
];

export default function FoundingClientPage() {
  return (
    <div className="bg-white font-sb text-sb-ink antialiased">
      <PillNav />
      <main>
        <section className="relative overflow-hidden pt-40 pb-14 text-center">
          <div aria-hidden className="animate-sb-drift pointer-events-none absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-[#d9cfff] opacity-60 blur-[70px]" />
          <div aria-hidden className="animate-sb-drift pointer-events-none absolute -right-32 top-20 h-[380px] w-[380px] rounded-full bg-[#ffd9e4] opacity-60 blur-[70px] [animation-delay:-6s]" />
          <div className="relative mx-auto max-w-[1200px] px-7">
            <Reveal><Eyebrow>Founding clients</Eyebrow></Reveal>
            <Reveal delay={1}>
              <h1 className="mx-auto max-w-3xl text-5xl font-extrabold tracking-tight sm:text-6xl">
                Claim a <Grad>founding spot.</Grad>
              </h1>
            </Reveal>
            <Reveal delay={2}>
              <p className="mx-auto mt-5 max-w-xl text-lg text-sb-ink2">
                {FRONT_OFFICE.FOUNDING_SPOTS_TOTAL} local businesses. Free setup. Founding price locked
                for 12 months. Tell us about your business and we&rsquo;ll take it from there.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="bg-white pb-24">
          <div className="mx-auto grid max-w-5xl gap-10 px-7 lg:grid-cols-[1fr_1.2fr]">
            <Reveal>
              <div>
                <Eyebrow>What you get</Eyebrow>
                <h2 className="text-3xl font-extrabold tracking-tight">As a founding client</h2>
                <ul className="mt-8 space-y-4">
                  {PERKS.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-[15px] text-sb-ink2">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sb-violet-soft font-extrabold text-sb-violet-dark">
                        ✓
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={1}>
              <div className="rounded-[26px] border border-sb-ink/10 bg-white p-8 shadow-[0_24px_60px_rgba(20,20,43,0.1)]">
                <Suspense>
                  <FoundingClientForm />
                </Suspense>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
