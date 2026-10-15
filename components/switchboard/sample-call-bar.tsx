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
 * Sample-call player card — the "console" that owns the zone between the nav
 * and the hero headline: dark live header, big waveform, scrolling transcript
 * ticker, transport controls. Same audio engine (base64-chunk MP3,
 * audio-driven turns, timer fallback).
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
  const done = step >= SCRIPT.length;
  /** Derived: actually advancing. No effect-syncing of setState needed. */
  const active = playing && !done;

  // Deterministic pseudo-random waveform heights — stable across renders.
  const bars = useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => {
        const x = Math.sin(i * 12.9898) * 43758.5453;
        return Math.round(14 + (x - Math.floor(x)) * 50);
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

  const turn = step > 0 && !done ? SCRIPT[Math.min(step, SCRIPT.length - 1)] : null;

  return (
    <Reveal className="relative z-[2] mx-auto w-full max-w-[880px]">
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

        {/* waveform + transcript ticker */}
        <div className="px-6 pb-2 pt-6 sm:px-8">
          <div className="flex h-16 items-center gap-[3px]" aria-hidden="true">
            {bars.map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}px`, animationDelay: `${-(i * 0.05)}s` }}
                className={`w-[3px] origin-center rounded-full transition-colors duration-300 ${
                  active ? "bg-sb-violet/80 motion-safe:animate-sb-wave" : "bg-sb-violet/35"
                }`}
              />
            ))}
          </div>
          <div className="mt-4 min-w-0 overflow-hidden">
            {done ? (
              <p
                key="done"
                className="truncate font-sb text-[15px] font-bold leading-snug text-sb-ink motion-safe:animate-sb-fade-swap"
              >
                ✓ Quoted $89 <span className="font-semibold text-sb-ink2">·</span> ✓ Booking request sent{" "}
                <span className="font-semibold text-sb-ink2">·</span> ✓ Owner notified by text
              </p>
            ) : turn ? (
              <p
                key={step}
                aria-live="polite"
                style={{ animationDuration: "14s" }}
                className={`flex w-max items-center whitespace-nowrap font-sb text-[15px] leading-snug ${
                  active ? "motion-safe:animate-sb-mq" : ""
                }`}
              >
                {[0, 1].map((copy) => (
                  <span key={copy} aria-hidden={copy === 1} className="flex items-center">
                    <span className={`font-extrabold ${turn.who === "ai" ? "text-sb-violet-dark" : "text-sb-ink"}`}>
                      {turn.who === "ai" ? "Wavva AI" : "Caller"}
                    </span>
                    <span className="text-sb-ink2"> — {turn.short}</span>
                    <span aria-hidden="true" className="mx-8 inline-block h-1.5 w-1.5 rounded-full bg-sb-violet/50" />
                  </span>
                ))}
              </p>
            ) : (
              <p className="truncate font-sb text-[15px] leading-snug text-sb-ink2">
                Press play to hear how Wavva answers.
              </p>
            )}
          </div>
        </div>

        {/* transport */}
        <div className="flex items-center justify-center gap-3 px-6 py-5">
          {!active && !done && (
            <button
              type="button"
              onClick={play}
              aria-label="Play sample call"
              className="rounded-full bg-sb-violet px-8 py-3 font-sb text-[15px] font-extrabold text-white shadow-[0_12px_28px_rgba(109,92,255,0.45)] transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sb-violet active:scale-95"
            >
              ▶&nbsp; Play sample call
            </button>
          )}
          {active && (
            <button
              type="button"
              onClick={pause}
              aria-label="Pause"
              className="rounded-full bg-sb-ink px-8 py-3 font-sb text-[15px] font-extrabold text-white shadow-[0_12px_28px_rgba(20,20,43,0.35)] transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sb-ink active:scale-95"
            >
              ❚❚&nbsp; Pause
            </button>
          )}
          {(step > 0 || done) && (
            <button
              type="button"
              onClick={restart}
              aria-label="Replay sample call"
              className="rounded-full border-[1.5px] border-sb-ink/15 px-8 py-3 font-sb text-[15px] font-extrabold text-sb-ink transition-all duration-200 hover:scale-[1.04] hover:border-sb-violet hover:text-sb-violet-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sb-violet active:scale-95"
            >
              ↺&nbsp; Replay
            </button>
          )}
        </div>
      </div>
    </Reveal>
  );
}
