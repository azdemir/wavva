/**
 * Sock Match Madness — memory match. Flip cards, reunite all 6 pairs
 * in as few moves as possible.
 */
import { AG_BASE_CSS, burstConfetti, readBest, sfx, unlockAudio, writeBest } from "./fx";

export interface SockRank {
  name: string;
  quip: string;
}

export interface SockStrings {
  name: string;
  tagline: string;
  startTitle: string;
  rule1: string;
  rule2: string;
  rule3: string;
  start: string;
  moves: string;
  pairs: string;
  time: string;
  secs: string;
  pairNames: string[];
  endTitle: string;
  ranks: SockRank[];
  playAgain: string;
}

export const SOCK_BEST_KEY = "tidypro-arcade-sock";
const PAIR_COUNT = 6;

export const SOCK_CSS =
  AG_BASE_CSS +
  `
.sm * { box-sizing: border-box; }
.sm { max-width: 560px; margin: 0 auto; font-family: ui-sans-serif, system-ui, sans-serif; color: var(--ag-text); user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
.sm-title { text-align: center; font-weight: 900; font-size: clamp(24px, 6vw, 34px); letter-spacing: -1px; margin: 4px 0 2px; }
.sm-title .sm-zap { color: #7c3aed; }
.sm-sub { text-align: center; color: var(--ag-muted); font-size: 14px; margin: 0 0 10px; }
.sm-hud { display: flex; gap: 8px; margin-bottom: 10px; }
.sm-hudbox { flex: 1; background: var(--ag-surface); border: 1px solid var(--ag-border); border-radius: 12px; padding: 6px 10px; text-align: center; }
.sm-hudbox .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--ag-muted); }
.sm-hudbox .val { font-size: 20px; font-weight: 800; font-variant-numeric: tabular-nums; }
.sm-board { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
@media (max-width: 480px) { .sm-board { grid-template-columns: repeat(3, 1fr); } }
.sm-card { perspective: 600px; background: none; border: none; padding: 0; cursor: pointer; aspect-ratio: 3 / 3.6; }
.sm-card:disabled { cursor: default; }
.sm-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform .35s cubic-bezier(.3,1.3,.5,1); }
.sm-card.flipped .sm-inner { transform: rotateY(180deg); }
.sm-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.sm-front { transform: rotateY(180deg); background: var(--ag-surface); border: 1px solid var(--ag-border); }
.sm-card.matched .sm-front { border-color: #22c55e; box-shadow: 0 0 0 2px #22c55e inset; }
.sm-card.matched { animation: sm-matchpop .4s; }
@keyframes sm-matchpop { 40% { transform: scale(1.07); } 100% { transform: scale(1); } }
.sm-back { background: linear-gradient(135deg, #2563eb, #1e40af); color: #fff; font-size: 30px; font-weight: 900; }
.sm-back::after { content: ""; position: absolute; inset: 6px; border-radius: 9px; border: 2px dashed rgba(255,255,255,.35); }
.sm-sock { position: relative; width: 46px; height: 64px; border-radius: 10px 10px 14px 14px; background: var(--pat); overflow: hidden; box-shadow: inset -5px 0 0 rgba(0,0,0,.08); }
.sm-cuff { position: absolute; top: 0; left: 0; right: 0; height: 12px; background: var(--cuff); border-bottom: 2px solid rgba(0,0,0,.14); }
.sm-toe { position: absolute; bottom: 0; left: 0; right: 0; height: 16px; background: var(--toe); }
.sm-heel { position: absolute; bottom: 13px; left: -5px; width: 15px; height: 19px; background: var(--toe); border-radius: 50%; }
.sm-p0 { --pat: repeating-linear-gradient(0deg, #ef4444 0 8px, #fff 8px 16px); --cuff: #b91c1c; --toe: #b91c1c; }
.sm-p1 { --pat: radial-gradient(circle, #fff 3.2px, transparent 3.8px) 0 0/16px 16px, #1d4ed8; --cuff: #1e3a8a; --toe: #1e3a8a; }
.sm-p2 { --pat: repeating-linear-gradient(45deg, #16a34a 0 8px, #dcfce7 8px 16px); --cuff: #15803d; --toe: #15803d; }
.sm-p3 { --pat: repeating-linear-gradient(90deg, #7c3aed 0 8px, #ede9fe 8px 16px); --cuff: #5b21b6; --toe: #5b21b6; }
.sm-p4 { --pat: linear-gradient(180deg, #f59e0b 50%, #fff7ed 50%); --cuff: #b45309; --toe: #b45309; }
.sm-p5 { --pat: repeating-conic-gradient(#0d9488 0% 25%, #ccfbf1 0% 50%) 0 0/18px 18px; --cuff: #0f766e; --toe: #0f766e; }
.sm-banner { position: absolute; left: 0; right: 0; top: 38%; display: none; justify-content: center; z-index: 10; pointer-events: none; }
.sm-banner.show { display: flex; }
.sm-banner span { font-size: clamp(16px, 4.5vw, 24px); font-weight: 900; padding: 10px 20px; border-radius: 14px; background: var(--ag-text); color: var(--ag-surface); animation: sm-bannerin 1.6s forwards; text-align: center; }
@keyframes sm-bannerin { 0% { opacity: 0; transform: scale(.7);} 12% { opacity: 1; transform: scale(1.05);} 20% { transform: scale(1);} 82% { opacity: 1;} 100% { opacity: 0; transform: scale(1);} }
.sm-overlay { position: absolute; inset: 0; z-index: 20; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px; border-radius: 16px; background: color-mix(in srgb, var(--ag-surface) 90%, transparent); backdrop-filter: blur(6px); }
.sm-overlay.hidden { display: none; }
.sm-big { font-size: clamp(28px, 7vw, 40px); font-weight: 900; letter-spacing: -1px; margin: 0 0 6px; color: var(--ag-text); }
.sm-rank { font-size: clamp(20px, 5vw, 26px); font-weight: 800; color: #7c3aed; margin: 4px 0; }
.sm-quip { color: var(--ag-muted); font-size: 14px; max-width: 340px; margin: 0 0 14px; }
.sm-rules { font-size: 13px; color: var(--ag-muted); max-width: 330px; margin: 0 0 16px; line-height: 1.7; }
.sm-btn { font-size: 17px; font-weight: 800; padding: 13px 34px; border-radius: 99px; border: none; cursor: pointer; background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; box-shadow: 0 6px 18px rgba(139,92,246,.35); }
.sm-btn:active { transform: scale(.96); }
.sm-stats { display: flex; gap: 8px; margin-bottom: 16px; }
.sm-stat { background: var(--ag-surface); border: 1px solid var(--ag-border); border-radius: 12px; padding: 8px 18px; }
.sm-stat .n { font-size: 22px; font-weight: 800; color: var(--ag-text); }
.sm-stat .l { font-size: 11px; color: var(--ag-muted); text-transform: uppercase; letter-spacing: .5px; }
@media (prefers-reduced-motion: reduce) { .sm * { animation-duration: .01ms !important; animation-iteration-count: 1 !important; } }
`;

function shuffledDeck(): number[] {
  const d: number[] = [];
  for (let i = 0; i < PAIR_COUNT; i++) d.push(i, i);
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function mountSockMatch(
  root: HTMLElement,
  s: SockStrings,
  onBest: (best: number) => void,
): () => void {
  const timers: number[] = [];
  const abort = new AbortController();
  let best = readBest(SOCK_BEST_KEY);

  const later = (fn: () => void, ms: number): number => {
    const id = window.setTimeout(fn, ms);
    timers.push(id);
    return id;
  };

  const nameParts = s.name.split(" ");
  const nameLast = nameParts.pop() ?? "";
  const nameHead = nameParts.join(" ");

  root.innerHTML = `
  <div class="ag sm">
    <div class="sm-title">${nameHead} <span class="sm-zap">${nameLast}</span></div>
    <p class="sm-sub">${s.tagline}</p>
    <div class="sm-hud">
      <div class="sm-hudbox"><div class="lbl">${s.moves}</div><div class="val" data-r="moves">0</div></div>
      <div class="sm-hudbox"><div class="lbl">${s.pairs}</div><div class="val" data-r="pairs">0/${PAIR_COUNT}</div></div>
      <div class="sm-hudbox"><div class="lbl">${s.time}</div><div class="val" data-r="time">0</div></div>
    </div>
    <div style="position:relative">
      <div class="sm-board" data-r="board"></div>
      <div class="sm-banner" data-r="banner"><span data-r="bannertext"></span></div>
      <div class="sm-overlay" data-r="startOv">
        <div class="sm-big">${s.startTitle}</div>
        <p class="sm-rules">${s.rule1}<br>${s.rule2}<br>${s.rule3}</p>
        <button class="sm-btn" data-r="startBtn">${s.start}</button>
      </div>
      <div class="sm-overlay hidden" data-r="endOv">
        <div class="sm-big">${s.endTitle}</div>
        <div class="sm-rank" data-r="rank"></div>
        <p class="sm-quip" data-r="quip"></p>
        <div class="sm-stats">
          <div class="sm-stat"><div class="n" data-r="stMoves">0</div><div class="l">${s.moves}</div></div>
          <div class="sm-stat"><div class="n" data-r="stTime">0</div><div class="l">${s.time}</div></div>
        </div>
        <button class="sm-btn" data-r="againBtn">${s.playAgain}</button>
      </div>
    </div>
  </div>`;

  const $ = (sel: string): HTMLElement => {
    const el = root.querySelector(`[data-r="${sel}"]`);
    if (!el || !(el instanceof HTMLElement)) throw new Error(`missing [data-r=${sel}]`);
    return el;
  };

  const board = $("board");
  const banner = $("banner");
  const bannerText = $("bannertext");
  const startOv = $("startOv");
  const endOv = $("endOv");
  const movesEl = $("moves");
  const pairsEl = $("pairs");
  const timeEl = $("time");

  let deck: number[] = [];
  let flipped: number[] = [];
  let matchedCount = 0;
  let moves = 0;
  let playing = false;
  let lock = false;
  let startTime = 0;
  let clockId = 0;

  const fmtTime = (ms: number): string =>
    s.secs.replace("{s}", String(Math.floor(ms / 1000)));

  function bannerShow(text: string): void {
    bannerText.textContent = text;
    banner.classList.remove("show");
    void banner.offsetWidth;
    banner.classList.add("show");
  }

  function cardEl(i: number): HTMLElement {
    const el = board.children[i];
    if (!(el instanceof HTMLElement)) throw new Error("missing card");
    return el;
  }

  function renderHud(): void {
    movesEl.textContent = String(moves);
    pairsEl.textContent = `${matchedCount}/${PAIR_COUNT}`;
  }

  function tick(): void {
    timeEl.textContent = fmtTime(Date.now() - startTime);
  }

  function buildBoard(): void {
    board.innerHTML = "";
    deck = shuffledDeck();
    flipped = [];
    matchedCount = 0;
    moves = 0;
    lock = false;
    deck.forEach((design, i) => {
      const btn = document.createElement("button");
      btn.className = "sm-card";
      btn.type = "button";
      btn.setAttribute("aria-label", `${s.name} card ${i + 1}`);
      btn.innerHTML = `
        <div class="sm-inner">
          <div class="sm-face sm-front"><div class="sm-sock sm-p${design}"><div class="sm-cuff"></div><div class="sm-heel"></div><div class="sm-toe"></div></div></div>
          <div class="sm-face sm-back">?</div>
        </div>`;
      btn.addEventListener("click", () => flip(i), { signal: abort.signal });
      board.appendChild(btn);
    });
    renderHud();
    timeEl.textContent = fmtTime(0);
  }

  function flip(i: number): void {
    if (!playing || lock) return;
    const el = cardEl(i);
    if (el.classList.contains("flipped") || el.classList.contains("matched")) return;
    if (flipped.includes(i)) return;
    unlockAudio();
    if (flipped.length === 0) {
      startTime = Date.now();
      if (clockId) window.clearInterval(clockId);
      clockId = window.setInterval(tick, 500);
    }
    el.classList.add("flipped");
    sfx.flip();
    flipped.push(i);
    if (flipped.length === 2) {
      moves++;
      renderHud();
      lock = true;
      const [a, b] = flipped;
      if (deck[a] === deck[b]) {
        const design = deck[a];
        later(() => {
          cardEl(a).classList.add("matched");
          cardEl(b).classList.add("matched");
          matchedCount++;
          renderHud();
          sfx.match();
          const pairName =
            s.pairNames[design] ?? `${s.pairs} ${matchedCount}`;
          bannerShow(pairName);
          flipped = [];
          lock = false;
          if (matchedCount === PAIR_COUNT) endGame();
        }, 350);
      } else {
        later(() => {
          cardEl(a).classList.remove("flipped");
          cardEl(b).classList.remove("flipped");
          flipped = [];
          lock = false;
          sfx.whiff();
        }, 750);
      }
    }
  }

  function rankFor(m: number): SockRank {
    const r = s.ranks;
    const fb = (name: string): SockRank => ({ name, quip: "" });
    if (m <= 8) return r[0] ?? fb("Rank 1");
    if (m <= 12) return r[1] ?? fb("Rank 2");
    if (m <= 18) return r[2] ?? fb("Rank 3");
    return r[3] ?? fb("Rank 4");
  }

  function endGame(): void {
    playing = false;
    window.clearInterval(clockId);
    clockId = 0;
    const elapsed = Date.now() - startTime;
    const rank = rankFor(moves);
    $("rank").textContent = rank.name;
    $("quip").textContent = rank.quip;
    $("stMoves").textContent = String(moves);
    $("stTime").textContent = fmtTime(elapsed);
    if (best === null || moves < best) {
      best = moves;
      writeBest(SOCK_BEST_KEY, best);
      onBest(best);
    }
    endOv.classList.remove("hidden");
    burstConfetti(endOv, 50);
    sfx.fanfare();
  }

  function startGame(): void {
    unlockAudio();
    buildBoard();
    playing = true;
    startOv.classList.add("hidden");
    endOv.classList.add("hidden");
    sfx.start();
  }

  buildBoard();
  $("startBtn").addEventListener("click", startGame, { signal: abort.signal });
  $("againBtn").addEventListener("click", startGame, { signal: abort.signal });

  return () => {
    abort.abort();
    window.clearInterval(clockId);
    for (const id of timers) window.clearTimeout(id);
    root.innerHTML = "";
  };
}
