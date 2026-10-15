"use client";

import { useEffect } from "react";
import { SbButton } from "./buttons";
import { Grad } from "./section-head";
import { SampleCallBar } from "./sample-call-bar";

/** Option-Q hero: giant headline, dual CTA. The sample-call strip lives above it. */
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
    <header className="relative overflow-hidden pt-24 text-center">
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
        <SampleCallBar />
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
          The AI <Grad>front office</Grad>
          <br />
          for every business.
        </h1>
        <p
          className="sb-reveal sb-hero-rise mx-auto mt-6 max-w-2xl font-sb text-lg text-sb-ink2 md:text-xl"
          style={{ transitionDelay: "0.2s" }}
        >
          Wavva answers every call <strong className="text-sb-ink">in your business&rsquo;s name</strong> — books
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
      </div>
    </header>
  );
}
