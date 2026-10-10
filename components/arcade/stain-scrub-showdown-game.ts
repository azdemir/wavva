/**
 * Stain Scrub Showdown — press and scrub 5 impossible stains
 * before the 45-second timer runs out.
 */
import { AG_BASE_CSS, burstConfetti, readBest, sfx, unlockAudio, writeBest } from "./fx";

export interface StainRank {
  name: string;
  quip: string;
}

export interface StainStrings {
  name: string;
  tagline: string;
  startTitle: string;
  rule1: string;
  rule2: string;
  rule3: string;
  start: string;
  timeLeft: string;
  stainNames: string[];
  clearedQuips: string[];
  winTitle: string;
  loseTitle: string;
  loseQuip: string;
  cleared: string;
  timeUsed: string;
  ranks: StainRank[];
  playAgain: string;
  best: string;
}

export const STAIN_BEST_KEY = "tidypro-arcade-stain";
const GAME_SECONDS = 45;
const STAIN_COUNT = 5;

interface StainDef {
  x: number; // percent
  y: number; // percent
  size: number; // px
  color: string;
  dark: string;
  blob: number;
}

const STAINS: StainDef[] = [
  { x: 22, y: 24, size: 120, color: "#ea580c", dark: "#9a3412", blob: 0 },
  { x: 68, y: 18, size: 105, color: "#9f1239", dark: "#4c0519", blob: 1 },
  { x: 45, y: 54, size: 135, color: "#b45309", dark: "#573a08", blob: 2 },
  { x: 78, y: 66, size: 100, color: "#65a30d", dark: "#365314", blob: 0 },
  { x: 16, y: 72, size: 115, color: "#78716c", dark: "#292524", blob: 1 },
];

const BLOBS = [
  "48% 52% 55% 45% / 52% 46% 54% 48%",
  "58% 42% 45% 55% / 45% 58% 42% 55%",
  "45% 55% 48% 52% / 55% 44% 56% 45%",
];

export const STAIN_CSS =
  AG_BASE_CSS +
  `
.st * { box-sizing: border-box; }
.st { max-width: 560px; margin: 0 auto; font-family: ui-sans-serif, system-ui, sans-serif; color: var(--ag-text); user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
.st-title { text-align: center; font-weight: 900; font-size: clamp(24px, 6vw, 34px); letter-spacing: -1px; margin: 4px 0 2px; }
.st-title .st-zap { color: #ea580c; }
.st-sub { text-align: center; color: var(--ag-muted); font-size: 14px; margin: 0 0 10px; }
.st-hud { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.st-count { font-size: 14px; font-weight: 800; white-space: nowrap; font-variant-numeric: tabular-nums; }
.st-timerwrap { flex: 1; }
.st-timebar { height: 12px; border-radius: 99px; background: var(--ag-surface2); border: 1px solid var(--ag-border); overflow: hidden; }
.st-timefill { height: 100%; width: 100%; border-radius: 99px; background: linear-gradient(90deg, #f59e0b, #fbbf24); transition: width .1s linear; }
.st-timefill.low { background: linear-gradient(90deg, #ef4444, #f97316); }
.st-secs { font-size: 12px; color: var(--ag-muted); text-align: right; font-variant-numeric: tabular-nums; }
.st-area { position: relative; aspect-ratio: 4 / 3; border-radius: 18px; overflow: hidden; border: 1px solid var(--ag-border);
  background-color: var(--ag-surface);
  background-image: radial-gradient(var(--ag-border) 1px, transparent 1.4px);
  background-size: 22px 22px;
  touch-action: none; cursor: none; }
@media (hover: none) { .st-area { cursor: default; } }
.st-stain { position: absolute; transform: translate(-50%, -50%); transition: opacity .12s, scale .12s; z-index: 2; }
.st-stain .blob { width: 100%; height: 100%; background: radial-gradient(circle at 38% 32%, var(--c1), var(--c2) 72%); box-shadow: inset -8px -10px 0 rgba(0,0,0,.14); animation: st-jiggle 2.4s infinite ease-in-out alternate; }
@keyframes st-jiggle { from { transform: rotate(-3deg) scale(1); } to { transform: rotate(3deg) scale(1.03); } }
.st-stain.poof .blob { animation: st-poof .45s ease-in forwards; }
@keyframes st-poof { 40% { transform: scale(1.35); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
.st-label { position: absolute; left: 50%; bottom: calc(100% + 6px); transform: translateX(-50%); white-space: nowrap; font-size: 11px; font-weight: 700; background: var(--ag-text); color: var(--ag-surface); padding: 3px 9px; border-radius: 99px; pointer-events: none; transition: opacity .3s; }
.st-stain.poof .st-label { opacity: 0; }
.st-sponge { position: absolute; width: 44px; height: 44px; border-radius: 13px; background: radial-gradient(circle at 32% 28%, #fde68a, #f59e0b 75%); box-shadow: inset 0 0 0 3px rgba(180,83,9,.4), 0 4px 10px rgba(0,0,0,.18); transform: translate(-50%, -50%); pointer-events: none; z-index: 15; display: none; }
.st-sponge.on { display: block; }
.st-sponge::after { content: ""; position: absolute; inset: 8px; border-radius: 7px; background-image: radial-gradient(rgba(120,53,15,.5) 2px, transparent 2.4px); background-size: 11px 11px; }
.st-banner { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; z-index: 12; pointer-events: none; }
.st-banner.show { display: flex; }
.st-banner span { font-size: clamp(18px, 5vw, 28px); font-weight: 900; padding: 10px 22px; border-radius: 16px; background: var(--ag-text); color: var(--ag-surface); animation: st-bannerin 1.8s forwards; text-align: center; }
@keyframes st-bannerin { 0% { opacity: 0; transform: scale(.7);} 12% { opacity: 1; transform: scale(1.05);} 20% { transform: scale(1);} 82% { opacity: 1;} 100% { opacity: 0; transform: scale(1);} }
.st-overlay { position: absolute; inset: 0; z-index: 20; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px; background: color-mix(in srgb, var(--ag-surface) 90%, transparent); backdrop-filter: blur(6px); }
.st-overlay.hidden { display: none; }
.st-big { font-size: clamp(28px, 7vw, 40px); font-weight: 900; letter-spacing: -1px; margin: 0 0 6px; color: var(--ag-text); }
.st-rank { font-size: clamp(20px, 5vw, 26px); font-weight: 800; color: #ea580c; margin: 4px 0; }
.st-quip { color: var(--ag-muted); font-size: 14px; max-width: 340px; margin: 0 0 14px; }
.st-rules { font-size: 13px; color: var(--ag-muted); max-width: 330px; margin: 0 0 16px; line-height: 1.7; }
.st-btn { font-size: 17px; font-weight: 800; padding: 13px 34px; border-radius: 99px; border: none; cursor: pointer; background: linear-gradient(135deg, #ea580c, #f59e0b); color: #fff; box-shadow: 0 6px 18px rgba(234,88,12,.35); }
.st-btn:active { transform: scale(.96); }
.st-stats { display: flex; gap: 8px; margin-bottom: 16px; }
.st-stat { background: var(--ag-surface); border: 1px solid var(--ag-border); border-radius: 12px; padding: 8px 18px; }
.st-stat .n { font-size: 22px; font-weight: 800; color: var(--ag-text); }
.st-stat .l { font-size: 11px; color: var(--ag-muted); text-transform: uppercase; letter-spacing: .5px; }
@media (prefers-reduced-motion: reduce) { .st * { animation-duration: .01ms !important; animation-iteration-count: 1 !important; } }
`;

interface LiveStain {
  def: StainDef;
  el: HTMLElement;
  dirt: number;
  cleared: boolean;
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function mountStainScrub(
  root: HTMLElement,
  s: StainStrings,
  onBest: (best: number) => void,
): () => void {
  const timers: number[] = [];
  const abort = new AbortController();
  let loopId = 0;
  let best = readBest(STAIN_BEST_KEY) ?? 0;
  let elapsed = 0;
  let playing = false;
  let clearedCount = 0;
  let lastScrubSfx = 0;
  const stains: LiveStain[] = [];

  const later = (fn: () => void, ms: number): number => {
    const id = window.setTimeout(fn, ms);
    timers.push(id);
    return id;
  };

  const nameParts = s.name.split(" ");
  const nameLast = nameParts.pop() ?? "";
  const nameHead = nameParts.join(" ");

  root.innerHTML = `
  <div class="ag st">
    <div class="st-title">${nameHead} <span class="st-zap">${nameLast}</span></div>
    <p class="st-sub">${s.tagline}</p>
    <div class="st-hud">
      <div class="st-count" data-r="count"></div>
      <div class="st-timerwrap">
        <div class="st-timebar"><div class="st-timefill" data-r="fill"></div></div>
        <div class="st-secs" data-r="secs"></div>
      </div>
    </div>
    <div style="position:relative">
      <div class="st-area" data-r="area">
        <div class="st-sponge" data-r="sponge"></div>
      </div>
      <div class="st-banner" data-r="banner"><span data-r="bannertext"></span></div>
      <div class="st-overlay" data-r="startOv">
        <div class="st-big">${s.startTitle}</div>
        <p class="st-rules">${s.rule1}<br>${s.rule2}<br>${s.rule3}</p>
        <button class="st-btn" data-r="startBtn">${s.start}</button>
      </div>
      <div class="st-overlay hidden" data-r="endOv">
        <div class="st-big" data-r="endTitle"></div>
        <div class="st-rank" data-r="rank"></div>
        <p class="st-quip" data-r="quip"></p>
        <div class="st-stats">
          <div class="st-stat"><div class="n" data-r="stCleared">0</div><div class="l">${s.cleared}</div></div>
          <div class="st-stat"><div class="n" data-r="stTime">0</div><div class="l">${s.timeUsed}</div></div>
        </div>
        <button class="st-btn" data-r="againBtn">${s.playAgain}</button>
      </div>
    </div>
  </div>`;

  const $ = (sel: string): HTMLElement => {
    const el = root.querySelector(`[data-r="${sel}"]`);
    if (!el || !(el instanceof HTMLElement)) throw new Error(`missing [data-r=${sel}]`);
    return el;
  };

  const area = $("area");
  const sponge = $("sponge");
  const banner = $("banner");
  const bannerText = $("bannertext");
  const startOv = $("startOv");
  const endOv = $("endOv");
  const countEl = $("count");
  const fillEl = $("fill");
  const secsEl = $("secs");

  function bannerShow(text: string): void {
    bannerText.textContent = text;
    banner.classList.remove("show");
    void banner.offsetWidth;
    banner.classList.add("show");
  }

  function renderHud(): void {
    const left = Math.max(0, Math.ceil(GAME_SECONDS - elapsed));
    countEl.textContent = `${clearedCount}/${STAIN_COUNT}`;
    secsEl.textContent = s.timeLeft.replace("{s}", String(left));
    fillEl.style.width = `${(left / GAME_SECONDS) * 100}%`;
    fillEl.classList.toggle("low", left <= 10);
  }

  function buildStains(): void {
    for (const st of stains) st.el.remove();
    stains.length = 0;
    STAINS.forEach((def, i) => {
      const el = document.createElement("div");
      el.className = "st-stain";
      el.style.left = `${def.x}%`;
      el.style.top = `${def.y}%`;
      el.style.width = `${def.size}px`;
      el.style.height = `${def.size * 0.86}px`;
      el.style.setProperty("--c1", def.color);
      el.style.setProperty("--c2", def.dark);
      const name = s.stainNames[i] ?? `Stain ${i + 1}`;
      el.innerHTML = `<div class="blob" style="border-radius:${BLOBS[def.blob % BLOBS.length]}"></div><div class="st-label">${name}</div>`;
      area.appendChild(el);
      stains.push({ def, el, dirt: 100, cleared: false });
    });
  }

  function paintStain(st: LiveStain): void {
    const k = st.dirt / 100;
    st.el.style.opacity = String(0.3 + 0.7 * k);
    st.el.style.scale = String(0.55 + 0.45 * k);
  }

  function clearStain(st: LiveStain): void {
    st.cleared = true;
    clearedCount++;
    st.el.classList.add("poof");
    bannerShow(pick(s.clearedQuips));
    sfx.pop();
    renderHud();
    later(() => st.el.remove(), 480);
    if (clearedCount === STAIN_COUNT) endGame(true);
  }

  function scrubAt(clientX: number, clientY: number): void {
    const rect = area.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    sponge.style.left = `${px}px`;
    sponge.style.top = `${py}px`;
    let hitAny = false;
    for (const st of stains) {
      if (st.cleared) continue;
      const cx = (st.def.x / 100) * rect.width;
      const cy = (st.def.y / 100) * rect.height;
      const r = (st.def.size / 2) * 0.95;
      const dist = Math.hypot(px - cx, py - cy);
      if (dist < r) {
        hitAny = true;
        st.dirt -= 16;
        if (st.dirt <= 0) {
          st.dirt = 0;
          clearStain(st);
        } else {
          paintStain(st);
        }
      }
    }
    if (hitAny) {
      const now = Date.now();
      if (now - lastScrubSfx > 130) {
        lastScrubSfx = now;
        sfx.scrub();
      }
    }
  }

  let scrubbing = false;

  area.addEventListener(
    "pointerdown",
    (e) => {
      if (!playing) return;
      unlockAudio();
      scrubbing = true;
      sponge.classList.add("on");
      try {
        area.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      scrubAt(e.clientX, e.clientY);
    },
    { signal: abort.signal },
  );
  area.addEventListener(
    "pointermove",
    (e) => {
      const active = e.pointerType === "touch" || (e.buttons & 1) !== 0 || scrubbing;
      if (!playing || !active) {
        if (e.pointerType !== "touch") sponge.classList.remove("on");
        return;
      }
      sponge.classList.add("on");
      scrubAt(e.clientX, e.clientY);
    },
    { signal: abort.signal },
  );
  const stopScrub = (): void => {
    scrubbing = false;
    sponge.classList.remove("on");
  };
  area.addEventListener("pointerup", stopScrub, { signal: abort.signal });
  area.addEventListener("pointercancel", stopScrub, { signal: abort.signal });
  area.addEventListener("pointerleave", stopScrub, { signal: abort.signal });
  area.addEventListener("contextmenu", (e) => e.preventDefault(), { signal: abort.signal });

  function loop(): void {
    if (!playing) return;
    elapsed += 0.1;
    renderHud();
    if (elapsed >= GAME_SECONDS) endGame(false);
  }

  function rankFor(timeLeft: number): StainRank {
    const r = s.ranks;
    const fb = (name: string): StainRank => ({ name, quip: "" });
    if (timeLeft >= 25) return r[0] ?? fb("Rank 1");
    if (timeLeft >= 15) return r[1] ?? fb("Rank 2");
    if (timeLeft >= 6) return r[2] ?? fb("Rank 3");
    return r[3] ?? fb("Rank 4");
  }

  function endGame(won: boolean): void {
    playing = false;
    window.clearInterval(loopId);
    loopId = 0;
    stopScrub();
    const timeLeft = Math.max(0, Math.ceil(GAME_SECONDS - elapsed));
    const used = Math.min(GAME_SECONDS, Math.floor(elapsed));
    if (won) {
      $("endTitle").textContent = s.winTitle;
      const rank = rankFor(timeLeft);
      $("rank").textContent = rank.name;
      $("quip").textContent = rank.quip;
      if (timeLeft > best) {
        best = timeLeft;
        writeBest(STAIN_BEST_KEY, best);
        onBest(best);
      }
      burstConfetti(endOv, 50);
      sfx.fanfare();
    } else {
      $("endTitle").textContent = s.loseTitle;
      $("rank").textContent = "";
      $("quip").textContent = s.loseQuip;
      sfx.bad();
    }
    $("stCleared").textContent = `${clearedCount}/${STAIN_COUNT}`;
    $("stTime").textContent = `${used}s`;
    endOv.classList.remove("hidden");
  }

  function startGame(): void {
    unlockAudio();
    buildStains();
    elapsed = 0;
    clearedCount = 0;
    playing = true;
    startOv.classList.add("hidden");
    endOv.classList.add("hidden");
    renderHud();
    sfx.start();
    if (loopId) window.clearInterval(loopId);
    loopId = window.setInterval(loop, 100);
  }

  buildStains();
  renderHud();
  $("startBtn").addEventListener("click", startGame, { signal: abort.signal });
  $("againBtn").addEventListener("click", startGame, { signal: abort.signal });

  return () => {
    abort.abort();
    window.clearInterval(loopId);
    for (const id of timers) window.clearTimeout(id);
    root.innerHTML = "";
  };
}
