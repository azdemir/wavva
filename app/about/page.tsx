import type { Metadata } from "next";
import { PillNav } from "@/components/switchboard/pill-nav";
import { Footer } from "@/components/switchboard/footer";
import { Reveal } from "@/components/switchboard/reveal";
import { Eyebrow, Grad } from "@/components/switchboard/section-head";
import { Counter } from "@/components/switchboard/counter";
import { TrialBand } from "@/components/switchboard/contact";

export const metadata: Metadata = {
  title: "About",
  description:
    "Wavva exists for one reason: no business should lose a customer to a missed call. The AI front office for every business.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="bg-white font-sb text-sb-ink antialiased">
      <PillNav />
      <main>
        <section className="relative overflow-hidden pt-40 pb-20 text-center">
          <div aria-hidden className="animate-sb-drift pointer-events-none absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-[#d9cfff] opacity-60 blur-[70px]" />
          <div aria-hidden className="animate-sb-drift pointer-events-none absolute -right-32 top-20 h-[380px] w-[380px] rounded-full bg-[#ffd9e4] opacity-60 blur-[70px] [animation-delay:-6s]" />
          <div className="relative mx-auto max-w-[1200px] px-7">
            <Reveal><Eyebrow>About</Eyebrow></Reveal>
            <Reveal delay={1}>
              <h1 className="mx-auto max-w-3xl text-5xl font-extrabold tracking-tight sm:text-6xl">
                No business should lose a customer <Grad>to a missed call.</Grad>
              </h1>
            </Reveal>
            <Reveal delay={2}>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-sb-ink2">
                Wavva is the AI front office for every business — the plumber on a roof, the
                dentist mid-procedure, the lawyer in court, the salon mid-appointment. While
                you&rsquo;re doing the work, Wavva answers, books, quotes, and collects.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="bg-sb-bg2 py-20">
          <div className="mx-auto max-w-[1200px] px-7">
            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  t: "Honest by design",
                  b: "Every caller is told they're speaking with your business's AI assistant. We never claim it's human — trust starts there.",
                },
                {
                  t: "Flat means flat",
                  b: "One monthly fee. No per-call charges, no per-minute billing, no surprise invoices. That's the whole pricing page.",
                },
                {
                  t: "Your business, your data",
                  b: "Your number stays yours, payments go to your account, and your data exports any time. We're the front office, not the landlord.",
                },
              ].map((v, i) => (
                <Reveal key={v.t} delay={(i % 3) as 0 | 1 | 2}>
                  <div className="h-full rounded-[26px] border border-white bg-white p-8 shadow-[0_16px_40px_rgba(20,20,43,0.08)]">
                    <h3 className="mb-2.5 text-xl font-extrabold">{v.t}</h3>
                    <p className="text-[15px] text-sb-ink2">{v.b}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="relative mt-6 overflow-hidden rounded-[36px] bg-sb-ink px-10 py-14 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 50% 80% at 50% 120%, rgba(109,92,255,0.4), transparent 70%)",
                }}
              />
              <div className="relative grid gap-8 sm:grid-cols-3">
                <div>
                  <b className="block bg-gradient-to-r from-[#b9aefc] to-[#ff8fab] bg-clip-text text-5xl font-extrabold text-transparent">
                    <Counter to={67} suffix="%" />
                  </b>
                  <span className="mt-2 block text-sm text-[#a9a9c9]">of prospects hire whoever responds first</span>
                </div>
                <div>
                  <b className="block bg-gradient-to-r from-[#b9aefc] to-[#ff8fab] bg-clip-text text-5xl font-extrabold text-transparent">
                    24/7
                  </b>
                  <span className="mt-2 block text-sm text-[#a9a9c9]">every call answered, every channel covered</span>
                </div>
                <div>
                  <b className="block bg-gradient-to-r from-[#b9aefc] to-[#ff8fab] bg-clip-text text-5xl font-extrabold text-transparent">
                    <Counter to={0} prefix="$" />
                  </b>
                  <span className="mt-2 block text-sm text-[#a9a9c9]">per-call charges — flat fee, always</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <TrialBand />
      </main>
      <Footer />
    </div>
  );
}
