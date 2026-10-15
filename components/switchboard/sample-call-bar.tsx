"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Reveal } from "./reveal";

type Turn = { who: "ai" | "caller"; text: string; short: string };

/** Sample call — transcript matches the real audio file turn-for-turn. */
const SCRIPT: Turn[] = [
  {
    who: "ai",
    text: "Hi, thanks for calling Brightline Plumbing — you're speaking with Brightline's AI assistant. This call may be recorded. How can I help?",
    short: "Thanks for calling Brightline Plumbing — you're speaking with our AI assistant. How can I help?",
  },
  {
    who: "caller",
    text: "Hi, my kitchen sink is draining really slow. What would it cost for someone to come look?",
    short: "My kitchen sink is draining really slow — what would it cost for someone to come look?",
  },
  {
    who: "ai",
    text: "I can help with that. A drain inspection visit is $89. Want me to set one up?",
    short: "A drain inspection visit is $89 — want me to set one up?",
  },
  { who: "caller", text: "Yeah — Tuesday morning if you've got anything.", short: "Yeah — Tuesday morning if you've got anything." },
  {
    who: "ai",
    text: "Tuesday morning works. What's your name and the best number to reach you?",
    short: "Tuesday morning works — what's your name and the best number to reach you?",
  },
  { who: "caller", text: "Marcus Reed, 555-014-2288.", short: "Marcus Reed, 555-014-2288." },
  {
    who: "ai",
    text: "Got it, Marcus. I've sent your Tuesday morning request to the owner — they'll confirm your slot by text shortly.",
    short: "Got it, Marcus — I've sent your Tuesday morning request to the owner.",
  },
  { who: "caller", text: "Perfect, thanks.", short: "Perfect, thanks." },
  { who: "ai", text: "You're welcome. Thanks for calling Brightline!", short: "You're welcome — thanks for calling Brightline!" },
];

const OUTCOMES = [
  "Quoted $89 — straight from the price list",
  "Booking request sent to the owner",
  "Owner notified by text",
];

/** Measured start time (seconds) of each turn in the audio file. */
const TURN_STARTS = [0.0, 7.55, 13.01, 18.16, 20.84, 24.48, 30.95, 37.13, 39.16];
/** Fallback pacing when the audio file isn't available. */
const STEP_MS = 2600;
/** The MP3 ships as base64 text chunks (binaries can't ride the push tool). */
const CHUNK_COUNT = 12;
const pad2 = (i: number) => String(i + 1).padStart(2, "0");
/** Same-origin first, then GitHub raw as a fallback for stale checkouts. */
const CHUNK_SOURCES = [
  (i: number) => `/call-audio/c${pad2(i)}.txt`,
  (i: number) => `https://raw.githubusercontent.com/azdemir/TidyPro/main/public/call-audio/c${pad2(i)}.txt`,
];

async function fetchChunks(base: (i: number) => string): Promise<string[]> {
  return Promise.all(
    Array.from({ length: CHUNK_COUNT }, (_, i) =>
      fetch(base(i)).then((r) => {
        if (!r.ok) throw new Error(`chunk ${i} -> ${r.status}`);
        return r.text();
      })
    )
  );
}

/**
 * Sample-call player — a full console that sits in its own section just
 * before "How it works": dark live header, transcript that builds turn by
 * turn, outcome chips, and a control bar with waveform + transport. Same
 * audio engine (base64-chunk MP3, audio-driven turns, timer fallback).
 */
export function SampleCallBar() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(true);
  /** Assume audio works until proven otherwise — then fall back to the timer. */
  const [useAudio, setUseAudio] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pendingPlay = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const done = step >= SCRIPT.length;
  /** Derived: actually advancing. No effect-syncing of setState needed. */
  const active = playing && !done;

  // Deterministic pseudo-random waveform heights — stable across renders.
  const bars = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => {
        const x = Math.sin(i * 12.9898) * 43758.5453;
        return Math.round(6 + (x - Math.floor(x)) * 24);
      }),
    []
  );

  // Reassemble the MP3 from its base64 text chunks.
  useEffect(() => {
    let alive = true;
    let url: string | null = null;
    (async () => {
      try {
        let parts: string[] | null = null;
        for (const base of CHUNK_SOURCES) {
          try {
            parts = await fetchChunks(base);
            break;
          } catch {
            /* try the next source */
          }
        }
        if (!parts) throw new Error("no audio source available");
        const bin = atob(parts.join("").trim());
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
        if (alive) setAudioUrl(url);
      } catch {
        if (alive) {
          setUseAudio(false);
          setAudioLoading(false);
        }
      } finally {
        if (alive) setAudioLoading(false);
      }
    })();
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  // If the user hit play while chunks were still loading, start once ready.
  useEffect(() => {
    if (audioUrl && pendingPlay.current) {
      pendingPlay.current = false;
      audioRef.current?.play().catch(() => setUseAudio(false));
    }
  }, [audioUrl]);

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
  }, [useAudio, audioUrl]);

  // ---- timer fallback mode (audio chunks missing) ----
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

  // Keep the latest turn in view (inner transcript only — never yanks the page).
  useEffect(() => {
    if (step === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [step]);

  const play = () => {
    setPlaying(true);
    if (!useAudio) return; // timer fallback drives itself
    if (audioUrl) {
      audioRef.current?.play().catch(() => setUseAudio(false));
    } else if (audioLoading) {
      pendingPlay.current = true; // start as soon as chunks land
    } else {
      setUseAudio(false);
    }
  };
  const pause = () => {
    setPlaying(false);
    pendingPlay.current = false;
    audioRef.current?.pause();
  };
  const restart = () => {
    setSeconds(0);
    if (useAudio && audioRef.current && audioUrl) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => setUseAudio(false));
      setPlaying(true);
    } else if (useAudio && audioLoading) {
      pendingPlay.current = true;
      setPlaying(true);
      setStep(0);
    } else {
      setStep(0);
      setPlaying(true);
    }
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const totalSecs = useAudio && duration > 0 ? Math.round(duration) : Math.round((SCRIPT.length * STEP_MS) / 1000);
  const tmm = String(Math.floor(totalSecs / 60)).padStart(2, "0");
  const tss = String(totalSecs % 60).padStart(2, "0");
  const progress = useAudio && duration > 0 ? Math.min(seconds / duration, 1) : step / SCRIPT.length;

  return (
    <Reveal className="relative mx-auto w-full max-w-[920px] px-5 py-14 sm:px-7 md:py-20">
      <div
        id="chatdemo"
        className="scroll-mt-28 overflow-hidden rounded-[24px] bg-white text-left shadow-[0_36px_90px_rgba(20,20,43,0.16)] ring-1 ring-sb-ink/10"
      >
        {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" className="hidden" />}

        {/* live header */}
        <div className="flex items-center gap-3 bg-sb-ink px-6 py-4 text-white">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span className="font-sb text-[13px] font-extrabold uppercase tracking-[0.18em]">
            Sample call
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 font-sb text-xs font-semibold text-white/70">
            Real AI voice
          </span>
          <span className="ml-auto font-sb text-sm font-bold tabular-nums text-white/85">
            {mm}:{ss} <span className="font-semibold text-white/45">/ {tmm}:{tss}</span>
          </span>
        </div>

        {/* progress */}
        <div className="h-1 w-full bg-sb-ink/10" aria-hidden="true">
          <div
            className="h-full bg-sb-violet transition-[width] duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        {/* transcript */}
        <div className="h-[340px] space-y-4 overflow-y-auto bg-sb-bg2 px-6 py-6" aria-live="polite">
          {SCRIPT.slice(0, step).map((t, i) => (
            <div key={i} className={`flex ${t.who === "caller" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-[20px] px-5 py-3.5 font-sb text-[15px] leading-relaxed motion-safe:animate-sb-fade-swap ${
                  t.who === "caller"
                    ? "rounded-br-md bg-sb-violet text-white"
                    : "rounded-bl-md border border-sb-ink/10 bg-white text-sb-ink"
                }`}
              >
                {t.who === "ai" && (
                  <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-sb-violet-dark">
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

        {/* control bar */}
        <div className="flex items-center gap-4 border-t border-sb-ink/10 bg-white px-6 py-4">
          {!active && !done && (
            <button
              type="button"
              onClick={play}
              aria-label="Play sample call"
              className="shrink-0 rounded-full bg-sb-violet px-7 py-3 font-sb text-[15px] font-extrabold text-white shadow-[0_12px_28px_rgba(109,92,255,0.45)] transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sb-violet active:scale-95"
            >
              ▶&nbsp; Play sample call
            </button>
          )}
          {active && (
            <button
              type="button"
              onClick={pause}
              aria-label="Pause"
              className="shrink-0 rounded-full bg-sb-ink px-7 py-3 font-sb text-[15px] font-extrabold text-white shadow-[0_12px_28px_rgba(20,20,43,0.35)] transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sb-ink active:scale-95"
            >
              ❚❚&nbsp; Pause
            </button>
          )}
          <div className="flex h-8 min-w-0 flex-1 items-center gap-[2px]" aria-hidden="true">
            {bars.map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}px`, animationDelay: `${-(i * 0.06)}s` }}
                className={`w-[2.5px] origin-center rounded-full transition-colors duration-300 ${
                  active ? "bg-sb-violet/80 motion-safe:animate-sb-wave" : "bg-sb-violet/30"
                }`}
              />
            ))}
          </div>
          {(step > 0 || done) && (
            <button
              type="button"
              onClick={restart}
              aria-label="Replay sample call"
              className="shrink-0 rounded-full border-[1.5px] border-sb-ink/15 px-6 py-3 font-sb text-[15px] font-extrabold text-sb-ink transition-all duration-200 hover:scale-[1.04] hover:border-sb-violet hover:text-sb-violet-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sb-violet active:scale-95"
            >
              ↺&nbsp; Replay
            </button>
          )}
        </div>
      </div>
    </Reveal>
  );
}
