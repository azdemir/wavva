"use client";

import { useState } from "react";
import { FAQS } from "./copy";
import { Reveal } from "./reveal";
import { Eyebrow, Grad } from "./section-head";
import { SbButton } from "./buttons";

/** FAQ accordion + help card. `limit` renders a teaser subset. */
export function Faq({ limit }: { limit?: number }) {
  const [open, setOpen] = useState(0);
  const items = limit ? FAQS.slice(0, limit) : FAQS;

  return (
    <section id="faq" className="bg-sb-bg2 py-28">
      <div className="mx-auto max-w-[1200px] px-7">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Reveal><Eyebrow>FAQs</Eyebrow></Reveal>
          <Reveal delay={1}>
            <h2 className="font-sb text-4xl font-extrabold tracking-tight text-sb-ink sm:text-5xl">
              Questions, <Grad>answered plainly.</Grad>
            </h2>
          </Reveal>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          <Reveal>
            {items.map((f, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={f.q}
                  className={`mb-3 overflow-hidden rounded-[20px] border border-sb-ink/10 bg-white transition-shadow ${
                    isOpen ? "shadow-[0_16px_36px_rgba(20,20,43,0.1)]" : ""
                  }`}
                >
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center justify-between gap-4 p-5 pl-6 text-left font-sb text-base font-bold text-sb-ink"
                    aria-expanded={isOpen}
                  >
                    {f.q}
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg transition-all duration-300 ${
                        isOpen ? "rotate-45 bg-sb-violet text-white" : "bg-sb-violet-soft text-sb-violet-dark"
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
                      <p className="px-6 pb-6 font-sb text-[15px] text-sb-ink2">{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {limit ? (
              <div className="mt-6 text-center">
                <SbButton href="/faq" variant="light">See all FAQs</SbButton>
              </div>
            ) : null}
          </Reveal>

          <Reveal delay={1} className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-sb-ink to-[#2a2a55] p-9 text-white lg:sticky lg:top-28">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 120%, rgba(109,92,255,0.55), transparent 70%)",
              }}
            />
            <h3 className="relative mb-2.5 font-sb text-[22px] font-extrabold">Still curious?</h3>
            <p className="relative mb-6 font-sb text-sm text-[#b9b9d9]">
              Talk to a human about Wavva — we answer our own phones too.
            </p>
            <SbButton href="/contact" variant="white" className="relative w-full" magnetic={false}>
              Contact us
            </SbButton>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
