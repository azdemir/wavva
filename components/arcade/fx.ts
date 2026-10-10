/** Tiny WebAudio bleeps, confetti, and best-score storage for the arcade games. */

let audio: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (audio) return audio;
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    audio = new AC();
    return audio;
  } catch {
    return null;
  }
}

/** Call from a user gesture before playing sounds. */
export function unlockAudio(): void {
  ctx();
}

export function beep(
  f0: number,
  f1: number,
  dur: number,
  type: OscillatorType = "square",
  vol = 0.1,
  delay = 0,
): void {
  const c = ctx();
  if (!c) return;
  try {
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(30, f0), t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch {
    /* audio unavailable — stay silent */
  }
}

export const sfx = {
  pop() {
    beep(560, 170, 0.09, "square", 0.09);
  },
  golden() {
    beep(880, 1560, 0.16, "triangle", 0.11);
  },
  bad() {
    beep(220, 70, 0.32, "sawtooth", 0.12);
  },
  whiff() {
    beep(150, 110, 0.07, "sine", 0.06);
  },
  flip() {
    beep(400, 700, 0.07, "triangle", 0.08);
  },
  match() {
    beep(660, 990, 0.12, "triangle", 0.1);
    beep(990, 1320, 0.14, "triangle", 0.1, 0.1);
  },
  start() {
    beep(440, 660, 0.1, "triangle", 0.09);
    beep(660, 880, 0.12, "triangle", 0.09, 0.11);
  },
  fanfare() {
    [523, 659, 784, 1046].forEach((f, i) =>
      beep(f, f, 0.14, "triangle", 0.1, i * 0.15),
    );
  },
  scrub() {
    beep(300, 520, 0.05, "sine", 0.035);
  },
};

export function readBest(key: string): number | null {
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}

export function writeBest(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* ignore */
  }
}

const CONFETTI_COLORS = [
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#a855f7",
  "#facc15",
];

export function burstConfetti(container: HTMLElement, count = 50): void {
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "ag-confetti";
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    p.style.animationDuration = `${1.8 + Math.random() * 1.6}s`;
    p.style.animationDelay = `${Math.random() * 0.8}s`;
    container.appendChild(p);
    window.setTimeout(() => p.remove(), 4200);
  }
}

/** Shared theme-aware tokens + confetti. Include in every game's CSS. */
export const AG_BASE_CSS = `
.ag { --ag-text: #0f172a; --ag-muted: #64748b; --ag-surface: #ffffff; --ag-surface2: #f1f5f9; --ag-border: #e2e8f0; }
.dark .ag { --ag-text: #f1f5f9; --ag-muted: #94a3b8; --ag-surface: #1e293b; --ag-surface2: #0f172a; --ag-border: #334155; }
.ag-confetti { position: absolute; top: -12px; width: 9px; height: 14px; z-index: 30; pointer-events: none; animation-name: ag-fall; animation-timing-function: linear; animation-fill-mode: forwards; }
@keyframes ag-fall { to { transform: translateY(560px) rotate(720deg); opacity: .8; } }
`;
