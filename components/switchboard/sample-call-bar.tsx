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

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="6.5" y="5" width="4" height="14" rx="1.6" />
      <rect x="13.5" y="5" width="4" height="14" rx="1.6" />
    </svg>
  );
}

function ReplayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 2.6-6.4" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

/**
 * Sample-call "live band" — a full-width broadcast-style strip that owns the
 * zone between the nav and the hero headline: status block, big waveform
 * with a scrolling transcript ticker, and transport controls. Same audio
 * engine (base64-chunk MP3, audio-driven turns, timer fallback).
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
      Array.from({ length: 64 }, (_, i) => {
        const x = Math.sin(i * 12.9898) * 43758.5453;
        return Math.round(12 + (x - Math.floor(x)) * 44);
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
    <Reveal className="relative z-[2] mb-10 w-full">
      <div id="chatdemo" className="scroll-mt-28">
        {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" className="hidden" />}

        <div className="flex flex-col gap-5 py-7 md:flex-row md:items-center md:gap-8">
          {/* status block */}
          <div className="flex shrink-0 items-center gap-3.5">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sb-violet/10">
              {active && (
                <span className="absolute inset-0 rounded-full bg-sb-violet/25 motion-safe:animate-ping" aria-hidden="true" />
              )}
              <PhoneIcon className="relative h-5 w-5 text-sb-violet" />
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-sb text-[11px] font-extrabold uppercase tracking-[0.18em] text-sb-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 motion-safe:animate-sb-pulse-dot" aria-hidden="true" />
                Sample call
              </p>
              <p className="mt-1 font-sb text-xs font-semibold tabular-nums text-sb-ink2">
                Real AI voice · <span className="text-sb-ink">{mm}:{ss}</span>
                <span className="text-sb-ink2/70"> / {tmm}:{tss}</span>
              </p>
            </div>
          </div>

          {/* waveform + transcript ticker */}
          <div className="min-w-0 flex-1">
            <div className="flex h-14 items-center gap-[3px]" aria-hidden="true">
              {bars.map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${h}px`, animationDelay: `${-(i * 0.045)}s` }}
                  className={`w-[3px] origin-center rounded-full transition-colors duration-300 ${
                    active ? "bg-sb-violet/80 motion-safe:animate-sb-wave" : "bg-sb-violet/35"
                  }`}
                />
              ))}
            </div>
            <div className="mt-2.5 min-w-0 overflow-hidden">
              {done ? (
                <p
                  key="done"
                  className="truncate font-sb text-sm font-bold leading-snug text-sb-ink motion-safe:animate-sb-fade-swap"
                >
                  ✓ Quoted $89 <span className="font-semibold text-sb-ink2">·</span> ✓ Booking request sent{" "}
                  <span className="font-semibold text-sb-ink2">·</span> ✓ Owner notified by text
                </p>
              ) : turn ? (
                <p
                  key={step}
                  aria-live="polite"
                  style={{ animationDuration: "14s" }}
                  className={`flex w-max items-center whitespace-nowrap font-sb text-sm leading-snug ${
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
                <p className="truncate font-sb text-sm leading-snug text-sb-ink2">
                  Press play to hear how Wavva answers.
                </p>
              )}
            </div>
          </div>

          {/* transport */}
          <div className="flex shrink-0 items-center gap-3">
            {!active && !done && (
              <button
                type="button"
                onClick={play}
                aria-label="Play sample call"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-sb-violet text-white shadow-[0_14px_34px_rgba(109,92,255,0.45)] transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sb-violet active:scale-95"
              >
                <PlayIcon className="ml-1 h-6 w-6" />
              </button>
            )}
            {active && (
              <button
                type="button"
                onClick={pause}
                aria-label="Pause"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-sb-ink text-white shadow-[0_14px_34px_rgba(20,20,43,0.35)] transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sb-ink active:scale-95"
              >
                <PauseIcon className="h-6 w-6" />
              </button>
            )}
            {(step > 0 || done) && (
              <button
                type="button"
                onClick={restart}
                aria-label="Replay sample call"
                className="flex h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-sb-ink/15 text-sb-ink transition-all duration-200 hover:scale-105 hover:border-sb-violet hover:text-sb-violet-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sb-violet active:scale-95"
              >
                <ReplayIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* progress hairline */}
        <div className="h-[3px] w-full bg-sb-ink/10" aria-hidden="true">
          <div
            className="h-full bg-sb-violet transition-[width] duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </Reveal>
  );
}
