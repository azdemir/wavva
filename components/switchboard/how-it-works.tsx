"use client";

import { useState } from "react";
import { HOW_STEPS } from "./copy";
import { Reveal } from "./reveal";
import { Eyebrow, Grad } from "./section-head";
import { WavvaMark } from "./logo";
import { ChatIcon, PhoneIcon } from "@/components/ui/icons";

/** How-it-works: numbered accordion + orbiting integration visual. */
export function HowItWorks() {
  const [open, setOpen] = useState(0);

  return (
    <section id="how" className="bg-white py-28">
      <div className="mx-auto max-w-[1200px] px-7">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Reveal><Eyebrow>How it works</Eyebrow></Reveal>
          <Reveal delay={1}>
            <h2 className="font-sb text-4xl font-extrabold tracking-tight text-sb-ink sm:text-5xl">
              Live in <Grad>four steps.</Grad>
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-4 font-sb text-lg text-sb-ink2">No hardware. No hiring. No training period.</p>
          </Reveal>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Reveal className="overflow-hidden rounded-[26px] border border-sb-ink/10 bg-white">
            {HOW_STEPS.map((s, i) => {
              const isOpen = open === i;
              return (
                <div key={s.title} className={i > 0 ? "border-t border-sb-ink/10" : ""}>
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center gap-4.5 p-6 text-left"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-sb text-[15px] font-extrabold transition-colors ${
                        isOpen ? "bg-sb-violet text-white" : "bg-sb-violet-soft text-sb-violet-dark"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <b className="flex-1 font-sb text-[16.5px] font-bold text-sb-ink">{s.title}</b>
                    <span
                      className={`text-[22px] text-sb-ink2 transition-transform duration-300 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 pl-[76px] font-sb text-[15px] text-sb-ink2">{s.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </Reveal>

          <Reveal delay={1} className="relative min-h-[520px] overflow-hidden rounded-[32px] border border-white bg-gradient-to-br from-sb-lav via-sb-pink to-sb-blue lg:sticky lg:top-28">
            <div className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2">
              <div className="animate-sb-spin-slower absolute inset-0 rounded-full border-[1.5px] border-dashed border-sb-violet/35">
                <span className="absolute -top-7 left-[calc(50%-28px)] grid h-14 w-14 place-items-center rounded-[18px] bg-white shadow-[0_14px_30px_rgba(20,20,43,0.18)]">
                  <PhoneIcon className="h-[22px] w-[22px] text-sb-ink" />
                </span>
              </div>
              <div className="animate-sb-spin-rev absolute inset-[52px] rounded-full border-[1.5px] border-dashed border-sb-violet/30">
                <span className="absolute -top-6 left-[calc(50%-24px)] grid h-12 w-12 place-items-center rounded-[16px] bg-white shadow-[0_14px_30px_rgba(20,20,43,0.18)]">
                  <ChatIcon className="h-[20px] w-[20px] text-sb-ink" />
                </span>
              </div>
              <div className="absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[32px] bg-sb-ink shadow-[0_20px_44px_rgba(20,20,43,0.35)]">
                <WavvaMark className="h-11 w-auto" />
              </div>
            </div>
            <div className="animate-sb-float absolute inset-x-8 bottom-8 flex items-center gap-3.5 rounded-[20px] border border-white/60 bg-white/90 p-4.5 shadow-[0_20px_44px_rgba(20,20,43,0.16)] backdrop-blur">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sb-violet font-sb font-extrabold text-white">S</span>
              <span>
                <b className="block font-sb text-sm">Incoming call answered</b>
                <small className="font-sb text-xs text-sb-ink2">Bright Smile Dental · booking confirmed</small>
              </span>
              <span className="ml-auto shrink-0 rounded-full bg-green-100 px-4 py-2 font-sb text-xs font-bold text-green-700">
                ✓ Handled
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
