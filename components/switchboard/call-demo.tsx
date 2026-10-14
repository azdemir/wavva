"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "./reveal";

type Turn = { who: "ai" | "caller"; text: string };

/** Scripted sample call — what a real answered call sounds like. */
const SCRIPT: Turn[] = [
  {
    who: "ai",
    text: "Hi, thanks for calling Brightline Plumbing — you're speaking with Brightline's AI assistant. This call may be recorded. How can I help?",
  },
  { who: "caller", text: "Hi, my kitchen sink is draining really slow. What would it cost for someone to come look?" },
  { who: "ai", text: "I can help with that. A drain inspection visit is $89. Want me to set one up?" },
  { who: "caller", text: "Yeah — Tuesday morning if you've got anything." },
  { who: "ai", text: "Tuesday morning works. What's your name and the best number to reach you?" },
  { who: "caller", text: "Marcus Reed, 555-014-2288." },
  {
    who: "ai",
    text: "Got it, Marcus. I've sent your Tuesday morning request to the owner — they'll confirm your slot by text shortly.",
  },
  { who: "caller", text: "Perfect, thanks." },
  { who: "ai", text: "You're welcome. Thanks for calling Brightline!" },
];

const OUTCOMES = [
  "Quoted $89 — straight from the price list",
  "Booking request sent to the owner",
  "Owner notified by text",
];

const STEP_MS = 2600;

/** The player card alone — used inside the hero. */
export function CallDemoPlayer() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const done = step >= SCRIPT.length;
  /** Derived: actually advancing. No effect-syncing of setState needed. */
  const active = playing && !done;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [active, step]);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [step]);

  const restart = () => {
    setStep(0);
    setSeconds(0);
    setPlaying(true);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <Reveal className="mx-auto max-w-[680px]">
      <div id="chatdemo" className="scroll-mt-28 overflow-hidden rounded-[28px] border border-sb-ink/10 bg-white text-left shadow-[0_30px_70px_rgba(20,20,43,0.12)]">
            {/* call header */}
            <div className="flex items-center justify-between bg-sb-ink px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                </span>
                <span className="font-sb text-sm font-extrabold uppercase tracking-[0.14em]">
                  Sample call
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 font-sb text-xs font-semibold text-white/70">
                  Scripted demo
                </span>
              </div>
              <span className="font-sb text-sm font-bold tabular-nums text-white/80">
                {mm}:{ss}
              </span>
            </div>

            {/* transcript */}
            <div className="h-[380px] space-y-4 overflow-y-auto bg-sb-bg2 px-6 py-6">
              {SCRIPT.slice(0, step).map((t, i) => (
                <div key={i} className={`flex ${t.who === "caller" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-[20px] px-5 py-3.5 font-sb text-[15px] leading-relaxed ${
                      t.who === "caller"
                        ? "rounded-br-md bg-sb-violet text-white"
                        : "rounded-bl-md border border-sb-ink/10 bg-white text-sb-ink"
                    }`}
                  >
                    {t.who === "ai" && (
                      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-sb-violet">
                        AI assistant
                      </p>
                    )}
                    {t.text}
                  </div>
                </div>
              ))}
              {step === 0 && !playing && (
                <p className="pt-24 text-center font-sb text-sm text-sb-ink2">
                  Press play to hear how Switchboard answers.
                </p>
              )}
              <div ref={bottomRef} />
            </div>

            {/* outcomes */}
            {done && (
              <div className="flex flex-wrap gap-2 border-t border-sb-ink/10 bg-white px-6 py-4">
                {OUTCOMES.map((o) => (
                  <span
                    key={o}
                    className="rounded-full bg-sb-violet-soft px-4 py-1.5 font-sb text-[13px] font-bold text-sb-violet-dark"
                  >
                    ✓ {o}
                  </span>
                ))}
              </div>
            )}

            {/* controls */}
            <div className="flex items-center justify-center gap-3 border-t border-sb-ink/10 bg-white px-6 py-5">
              {!active && !done && (
                <button
                  onClick={() => setPlaying(true)}
                  className="rounded-full bg-sb-violet px-8 py-3 font-sb text-[15px] font-extrabold text-white transition-transform hover:scale-[1.03]"
                >
                  ▶&nbsp; Play sample call
                </button>
              )}
              {active && (
                <button
                  onClick={() => setPlaying(false)}
                  className="rounded-full bg-sb-ink px-8 py-3 font-sb text-[15px] font-extrabold text-white transition-transform hover:scale-[1.03]"
                >
                  ❚❚&nbsp; Pause
                </button>
              )}
              {(step > 0 || done) && (
                <button
                  onClick={restart}
                  className="rounded-full border-[1.5px] border-sb-ink/15 px-8 py-3 font-sb text-[15px] font-extrabold text-sb-ink transition-transform hover:scale-[1.03]"
                >
                  ↺&nbsp; Replay
                </button>
              )}
            </div>
          </div>
        </Reveal>
  );
}
