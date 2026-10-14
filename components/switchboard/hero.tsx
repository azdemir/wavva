"use client";

import { useEffect } from "react";
import { SbButton } from "./buttons";
import { Grad } from "./section-head";
import { Counter } from "./counter";

/** Option-Q hero: badges, giant headline, dual CTA, avatar arcs, dashboard mock. */
export function Hero() {
  useEffect(() => {
    const t = requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.querySelectorAll(".sb-hero-rise").forEach((el) => el.classList.add("sb-in"))
      )
    );
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <header className="relative overflow-hidden pt-40 text-center">
      {/* pastel blobs */}
      <div aria-hidden className="animate-sb-drift pointer-events-none absolute -left-32 -top-36 h-[520px] w-[520px] rounded-full bg-[#d9cfff] opacity-60 blur-[70px]" />
      <div aria-hidden className="animate-sb-drift pointer-events-none absolute -right-32 top-10 h-[460px] w-[460px] rounded-full bg-[#ffd9e4] opacity-60 blur-[70px] [animation-delay:-6s]" />
      <div aria-hidden className="animate-sb-drift pointer-events-none absolute left-[32%] top-[520px] h-[380px] w-[380px] rounded-full bg-[#d6f2e2] opacity-40 blur-[70px] [animation-delay:-3s]" />

      {/* dotted arcs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-260px] h-[900px] w-[900px] -translate-x-1/2 rounded-full border-[1.5px] border-dashed border-sb-violet/25" />
        <div className="absolute left-1/2 top-[-390px] h-[1150px] w-[1150px] -translate-x-1/2 rounded-full border-[1.5px] border-dashed border-sb-violet/20" />
      </div>

      <div className="relative z-[2] mx-auto max-w-[1200px] px-7">
        {/* hidden eyebrow — keeps its vertical space so the hero does not shift */}
        <span
          aria-hidden
          className="invisible mb-7 inline-flex items-center gap-2 rounded-full border border-white bg-gradient-to-r from-sb-lav to-sb-pink px-5 py-2.5 font-sb text-[13px] font-bold shadow-[0_8px_22px_rgba(109,92,255,0.14)]"
        >
          &nbsp;
        </span>
        <h1
          className="sb-reveal sb-hero-rise mx-auto max-w-5xl font-sb text-[clamp(48px,7.2vw,96px)] font-extrabold leading-[1.04] tracking-tight text-sb-ink"
          style={{ transitionDelay: "0.1s" }}
        >
          Every call <Grad>answered.</Grad>
          <br />
          Every business.
        </h1>
        <p
          className="sb-reveal sb-hero-rise mx-auto mt-6 max-w-2xl font-sb text-lg text-sb-ink2 md:text-xl"
          style={{ transitionDelay: "0.2s" }}
        >
          Switchboard answers every call <strong className="text-sb-ink">in your business&rsquo;s name</strong> — books
          appointments, sends quotes, follows up until you&rsquo;re paid.{" "}
          <strong className="text-sb-ink">You run the business.</strong>
        </p>
        <div
          className="sb-reveal sb-hero-rise mt-9 flex flex-wrap justify-center gap-3.5"
          style={{ transitionDelay: "0.3s" }}
        >
          <SbButton href="#trial" size="lg">Start free 7-day trial</SbButton>
          <SbButton href="#chatdemo" size="lg" variant="light">Hear a sample call</SbButton>
        </div>
        <div
          className="sb-reveal sb-hero-rise mt-7 flex items-center justify-center gap-3 font-sb text-sm font-semibold text-sb-ink2"
          style={{ transitionDelay: "0.4s" }}
        >
          <span className="tracking-[2px] text-[#f5a623]">★★★★★</span>
          <span>
            <strong className="text-sb-ink">67%</strong> of prospects hire whoever responds first · No card
            required
          </span>
        </div>

        {/* dashboard mock */}
        <div className="sb-reveal mx-auto mt-16 max-w-[1020px]" style={{ transitionDelay: "0.15s" }}>
          <DashboardMock />
        </div>
      </div>
    </header>
  );
}

function DashboardMock() {
  return (
    <div className="overflow-hidden rounded-[32px] border border-sb-ink/10 bg-white text-left shadow-[0_50px_110px_rgba(20,20,43,0.16)]">
      <div className="flex items-center gap-3.5 border-b border-sb-ink/10 px-6 py-4">
        <div className="flex gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-sb text-[13px] font-bold">Switchboard · Mission control</span>
        <span className="ml-auto font-sb text-xs italic text-sb-ink2">Sample data</span>
      </div>
      <div className="grid md:grid-cols-[200px_1fr]">
        <div className="hidden flex-col gap-1 border-r border-sb-ink/10 bg-sb-bg2 p-4 md:flex">
          {["◧ Dashboard", "◷ Calls", "▤ Bookings", "▦ Invoices", "◈ Reports"].map((l, i) => (
            <span
              key={l}
              className={`rounded-xl px-3 py-2.5 font-sb text-[13px] font-semibold ${
                i === 0 ? "bg-white text-sb-ink shadow-[0_4px_12px_rgba(20,20,43,0.07)]" : "text-sb-ink2"
              }`}
            >
              {l}
            </span>
          ))}
        </div>
        <div className="p-6">
          <h4 className="font-sb text-lg font-extrabold">Good morning, owner</h4>
          <p className="mb-4 font-sb text-xs text-sb-ink2">Tuesday · your front office handled the night shift</p>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { l: "Calls answered", v: 48, d: "▲ 12%" },
              { l: "Appointments booked", v: 31, d: "▲ 8%" },
              { l: "Quotes sent", v: 12, d: "▲ 5%" },
              { l: "AI answer rate", v: 94, s: "%", d: "▲ 2.1%" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-sb-bg2 p-3.5">
                <small className="mb-1 block font-sb text-[11px] font-semibold text-sb-ink2">{s.l}</small>
                <b className="font-sb text-[21px] font-extrabold">
                  <Counter to={s.v} suffix={s.s ?? ""} />
                </b>
                <div className="text-[11.5px] font-bold text-green-600">{s.d}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-sb-bg2 p-4">
            <div className="mb-2.5 flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-sb-ink2 text-[11px] font-extrabold text-white">C</span>
              <span className="max-w-[75%] rounded-[4px_14px_14px_14px] border border-sb-ink/10 bg-white px-3.5 py-2 font-sb text-[13px]">
                Hi — do you have anything Thursday?
              </span>
            </div>
            <div className="mb-2.5 flex justify-end">
              <span className="max-w-[75%] rounded-[14px_4px_14px_14px] bg-sb-violet px-3.5 py-2 font-sb text-[13px] text-white">
                We have 2 PM or 4:30 PM — which works?
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-sb-violet text-[11px] font-extrabold text-white">S</span>
              <span className="inline-flex gap-1.5 rounded-[4px_14px_14px_14px] border border-sb-ink/10 bg-white px-4 py-3">
                <i className="animate-sb-typing h-[7px] w-[7px] rounded-full bg-sb-ink2" />
                <i className="animate-sb-typing h-[7px] w-[7px] rounded-full bg-sb-ink2 [animation-delay:0.15s]" />
                <i className="animate-sb-typing h-[7px] w-[7px] rounded-full bg-sb-ink2 [animation-delay:0.3s]" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
