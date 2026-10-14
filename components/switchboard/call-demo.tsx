"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "./reveal";

type Turn = { who: "ai" | "caller"; text: string };

/** Sample call — transcript matches the real audio file turn-for-turn. */
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

const AUDIO_SRC = "/sample-call.mp3";
/** Measured start time (seconds) of each turn in the audio file. */
const TURN_STARTS = [0.0, 7.55, 13.01, 18.16, 20.84, 24.48, 30.95, 37.13, 39.16];
/** Fallback pacing when the audio file isn't available. */
const STEP_MS = 2600;

/** The player card alone — used inside the hero. */
export function CallDemoPlayer() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  /** Assume the audio file exists until an error proves otherwise. */
  const [useAudio, setUseAudio] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const done = step >= SCRIPT.length;
  /** Derived: actually advancing. No effect-syncing of setState needed. */
  const active = playing && !done;

  // ---- audio-driven mode ----
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !useAudio) return;
    const onTime = () => {
      setSeconds(Math.floor(a.currentTime));
      let s = 0;
      for (const t of TURN_STARTS) if (a.currentTime >= t) s++;
      setStep(Math.min(s, SCRIPT.length));
    };
    const onEnd = () => {
      setStep(SCRIPT.length);
      setPlaying(false);
    };
    const onMeta = () => setDuration(a.duration || 0);
    const onErr = () => setUseAudio(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("error", onErr);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("error", onErr);
    };
  }, [useAudio]);

  // ---- timer fallback mode (audio file missing) ----
  useEffect(() => {
    if (useAudio || !active) return;
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [useAudio, active, step]);

  useEffect(() => {
    if (useAudio || !active) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [useAudio, active]);

  useEffect(() => {
    if (step === 0) return; // don't yank scroll position on page load
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [step]);

  const play = () => {
    setPlaying(true);
    if (useAudio) {
      audioRef.current?.play().catch(() => setUseAudio(false));
    }
  };
  const pause = () => {
    setPlaying(false);
    audioRef.current?.pause();
  };
  const restart = () => {
    setSeconds(0);
    if (useAudio && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => setUseAudio(false));
      setPlaying(true);
    } else {
      setStep(0);
      setPlaying(true);
    }
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const progress = useAudio && duration > 0 ? Math.min(seconds / duration, 1) : step / SCRIPT.length;

  return (
    <Reveal className="mx-auto max-w-[680px]">
      <div id="chatdemo" className="scroll-mt-28 overflow-hidden rounded-[28px] border border-sb-ink/10 bg-white text-left shadow-[0_30px_70px_rgba(20,20,43,0.12)]">
            <audio ref={audioRef} src={AUDIO_SRC} preload="auto" className="hidden" />
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
                  Real AI voice
                </span>
              </div>
              <span className="font-sb text-sm font-bold tabular-nums text-white/80">
                {mm}:{ss}
              </span>
            </div>
            {/* progress */}
            <div className="h-1 w-full bg-sb-ink/10">
              <div
                className="h-full bg-sb-violet transition-[width] duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
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
                  Press play to hear how Wavva answers.
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
                  onClick={play}
                  className="rounded-full bg-sb-violet px-8 py-3 font-sb text-[15px] font-extrabold text-white transition-transform hover:scale-[1.03]"
                >
                  ▶&nbsp; Play sample call
                </button>
              )}
              {active && (
                <button
                  onClick={pause}
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
