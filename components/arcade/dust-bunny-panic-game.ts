/**
 * Dust Bunny Panic — 30-second whack-a-mole.
 * Tap dust bunnies, spare the cat, chase the golden jackpot.
 */
import { AG_BASE_CSS, burstConfetti, readBest, sfx, unlockAudio, writeBest } from "./fx";

export interface DbpRank {
  name: string;
  quip: string;
}

export interface DbpStrings {
  name: string;
  tagline: string;
  startTitle: string;
  rule1: string;
  rule2: string;
  rule3: string;
  rule4: string;
  start: string;
  score: string;
  timeLeft: string;
  combo: string;
  taunts: string[];
  catTaunts: string[];
  goldenTaunts: string[];
  toddlerEvent: string;
  clientEvent: string;
  jackpot: string;
  catSeen: string;
  endTitle: string;
  whacked: string;
  golden: string;
  cats: string;
  bestCombo: string;
  ranks: DbpRank[];
  foot: string;
  playAgain: string;
  best: string;
}

export const DBP_BEST_KEY = "tidypro-arcade-dbp";
const GAME_SECONDS = 30;

export const DBP_CSS =
  AG_BASE_CSS +
  `
.dbp * { box-sizing: border-box; }
.dbp { max-width: 520px; margin: 0 auto; font-family: ui-sans-serif, system-ui, sans-serif; color: var(--ag-text); user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
.dbp.shake { animation: dbp-shake .35s; }
@keyframes dbp-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(4px)} }
.dbp-title { text-align: center; font-weight: 900; font-size: clamp(26px, 6vw, 38px); letter-spacing: -1px; margin: 4px 0 2px; }
.dbp-title .dbp-zap { color: #f0a92e; }
.dbp-sub { text-align: center; color: var(--ag-muted); font-size: 14px; margin: 0 0 10px; }
.dbp-hud { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.dbp-scorebox { min-width: 92px; }
.dbp-scorebox .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--ag-muted); }
.dbp-score { font-size: 30px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
.dbp-best { font-size: 11px; color: var(--ag-muted); }
.dbp-timerwrap { flex: 1; }
.dbp-timebar { height: 12px; border-radius: 99px; background: var(--ag-surface2); border: 1px solid var(--ag-border); overflow: hidden; }
.dbp-timefill { height: 100%; width: 100%; border-radius: 99px; background: linear-gradient(90deg, #37c871, #a3e635); transition: width .1s linear; }
.dbp-timefill.low { background: linear-gradient(90deg, #ef4444, #f97316); }
.dbp-secs { font-size: 12px; color: var(--ag-muted); text-align: right; font-variant-numeric: tabular-nums; }
.dbp-combo { display: none; font-size: 12px; font-weight: 800; color: #fff; background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 4px 10px; border-radius: 99px; white-space: nowrap; }
.dbp-combo.on { display: inline-block; animation: dbp-pop .25s; }
@keyframes dbp-pop { from { transform: scale(.6); } to { transform: scale(1); } }
.dbp-field { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; touch-action: none; }
.dbp-cell { position: relative; aspect-ratio: 1 / .92; border-radius: 16px; background: var(--ag-surface); border: 1px solid var(--ag-border); overflow: hidden; cursor: pointer; }
.dbp-cell:active { transform: scale(.97); }
.dbp-mound { position: absolute; left: 8%; right: 8%; bottom: -14px; height: 34px; border-radius: 50%; background: var(--ag-surface2); border: 1px solid var(--ag-border); }
.dbp-critter { position: absolute; left: 50%; bottom: 12px; transform: translateX(-50%); animation: dbp-rise .28s cubic-bezier(.2,1.4,.4,1); z-index: 2; }
.dbp-critter.escaping { animation: dbp-dive .25s ease-in forwards; }
@keyframes dbp-rise { from { transform: translateX(-50%) translateY(46px) scale(.5); opacity: 0; } to { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; } }
@keyframes dbp-dive { to { transform: translateX(-50%) translateY(52px) scale(.5); opacity: 0; } }
.dbp-squash { animation: dbp-squash .22s ease-in forwards; transform-origin: bottom center; }
@keyframes dbp-squash { 40% { transform: scale(1.25, .6); } 100% { transform: scale(1.6, .25); opacity: 0; } }
.dbp-bunny { position: relative; width: 62px; height: 54px; }
.dbp-body { position: absolute; inset: 0; border-radius: 50% 50% 46% 46%; background: radial-gradient(circle at 35% 28%, #d6dbe1, #9aa1a9 72%); box-shadow: inset -6px -8px 0 rgba(0,0,0,.08); }
.dbp-bunny.golden .dbp-body { background: radial-gradient(circle at 35% 28%, #ffe9a8, #f0a92e 72%); box-shadow: 0 0 18px 4px rgba(240,169,46,.55); }
.dbp-ear { position: absolute; top: -20px; width: 17px; height: 28px; border-radius: 50%; background: #9aa1a9; }
.dbp-ear.l { left: 11px; transform: rotate(-14deg); }
.dbp-ear.r { right: 11px; transform: rotate(14deg); }
.dbp-ear::after { content: ""; position: absolute; left: 4px; top: 6px; width: 9px; height: 15px; border-radius: 50%; background: #f3b8c6; }
.dbp-bunny.golden .dbp-ear { background: #e8b23a; }
.dbp-eye { position: absolute; top: 22px; width: 11px; height: 13px; background: #fff; border-radius: 50%; }
.dbp-eye.l { left: 17px; } .dbp-eye.r { right: 17px; }
.dbp-eye::after { content: ""; position: absolute; left: 3px; top: 5px; width: 5px; height: 6px; background: #1f2937; border-radius: 50%; }
.dbp-nose { position: absolute; left: 50%; top: 36px; width: 7px; height: 6px; margin-left: -3.5px; background: #f3b8c6; border-radius: 40% 40% 60% 60%; }
.dbp-sock { position: absolute; top: -34px; left: 2px; width: 22px; height: 30px; transform: rotate(-18deg); background: repeating-linear-gradient(45deg, #e2574c 0 5px, #fff 5px 10px); border-radius: 7px 7px 5px 5px; box-shadow: inset -3px 0 0 rgba(0,0,0,.12); }
.dbp-sock::after { content: ""; position: absolute; bottom: -6px; left: 0; width: 30px; height: 12px; background: #e2574c; border-radius: 0 0 8px 8px; }
.dbp-cat { position: relative; width: 62px; height: 54px; }
.dbp-cat .dbp-body { background: radial-gradient(circle at 35% 28%, #e8b48a, #c47b42 72%); }
.dbp-catear { position: absolute; top: -14px; width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-bottom: 20px solid #c47b42; }
.dbp-catear.l { left: 4px; transform: rotate(-12deg); } .dbp-catear.r { right: 4px; transform: rotate(12deg); }
.dbp-cateye { position: absolute; top: 22px; width: 13px; height: 5px; background: #1f2937; border-radius: 3px; }
.dbp-cateye.l { left: 14px; transform: rotate(12deg); } .dbp-cateye.r { right: 14px; transform: rotate(-12deg); }
.dbp-whisker { position: absolute; top: 34px; width: 16px; height: 2px; background: rgba(255,255,255,.85); border-radius: 2px; }
.dbp-whisker.l1 { left: -8px; transform: rotate(8deg);} .dbp-whisker.l2 { left: -8px; top: 39px; transform: rotate(-8deg);}
.dbp-whisker.r1 { right: -8px; transform: rotate(-8deg);} .dbp-whisker.r2 { right: -8px; top: 39px; transform: rotate(8deg);}
.dbp-catmouth { position: absolute; left: 50%; top: 38px; margin-left: -6px; font-size: 11px; font-weight: 900; color: #5b3418; }
.dbp-crumb { width: 14px; height: 14px; border-radius: 50% 40% 55% 45%; background: radial-gradient(circle at 35% 30%, #d9a066, #8a5a2b); animation: dbp-wiggle .5s infinite alternate ease-in-out; }
@keyframes dbp-wiggle { from { transform: translateX(-50%) rotate(-12deg);} to { transform: translateX(-50%) rotate(12deg);} }
.dbp-taunt { position: absolute; left: 50%; bottom: 108%; transform: translateX(-50%); white-space: nowrap; font-size: 11px; font-weight: 700; background: var(--ag-text); color: var(--ag-surface); padding: 4px 8px; border-radius: 10px; animation: dbp-tauntfade 1.1s forwards; pointer-events: none; z-index: 5; }
.dbp-taunt::after { content: ""; position: absolute; top: 100%; left: 50%; margin-left: -4px; border: 4px solid transparent; border-top-color: var(--ag-text); }
@keyframes dbp-tauntfade { 0% { opacity: 0; transform: translateX(-50%) translateY(6px);} 15% { opacity: 1; transform: translateX(-50%) translateY(0);} 75% { opacity: 1;} 100% { opacity: 0; transform: translateX(-50%) translateY(-8px);} }
.dbp-float { position: absolute; left: 50%; bottom: 70%; transform: translateX(-50%); font-weight: 900; font-size: 18px; color: #16a34a; animation: dbp-risefade .7s forwards; pointer-events: none; z-index: 6; }
.dbp-float.bad { color: #ef4444; }
@keyframes dbp-risefade { to { transform: translateX(-50%) translateY(-34px); opacity: 0; } }
.dbp-banner { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; z-index: 10; pointer-events: none; }
.dbp-banner.show { display: flex; }
.dbp-banner span { font-size: clamp(20px, 5vw, 30px); font-weight: 900; text-align: center; padding: 12px 22px; border-radius: 16px; background: var(--ag-text); color: var(--ag-surface); animation: dbp-bannerin 2s forwards; }
@keyframes dbp-bannerin { 0% { opacity: 0; transform: scale(.7);} 12% { opacity: 1; transform: scale(1.05);} 20% { transform: scale(1);} 82% { opacity: 1;} 100% { opacity: 0; transform: scale(1);} }
.dbp-overlay { position: absolute; inset: 0; z-index: 20; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px; border-radius: 16px; background: color-mix(in srgb, var(--ag-surface) 88%, transparent); backdrop-filter: blur(6px); }
.dbp-overlay.hidden { display: none; }
.dbp-big { font-size: clamp(30px, 7vw, 44px); font-weight: 900; letter-spacing: -1px; margin: 0 0 6px; color: var(--ag-text); }
.dbp-rank { font-size: clamp(20px, 5vw, 28px); font-weight: 800; color: #f0a92e; margin: 4px 0; }
.dbp-quip { color: var(--ag-muted); font-size: 14px; max-width: 340px; margin: 0 0 14px; }
.dbp-rules { font-size: 13px; color: var(--ag-muted); max-width: 330px; margin: 0 0 16px; line-height: 1.7; }
.dbp-btn { font-size: 17px; font-weight: 800; padding: 13px 34px; border-radius: 99px; border: none; cursor: pointer; background: linear-gradient(135deg, #16a34a, #22c55e); color: #fff; box-shadow: 0 6px 18px rgba(34,197,94,.35); }
.dbp-btn:active { transform: scale(.96); }
.dbp-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; width: 100%; max-width: 340px; }
.dbp-stat { background: var(--ag-surface); border: 1px solid var(--ag-border); border-radius: 12px; padding: 8px; }
.dbp-stat .n { font-size: 22px; font-weight: 800; color: var(--ag-text); }
.dbp-stat .l { font-size: 11px; color: var(--ag-muted); text-transform: uppercase; letter-spacing: .5px; }
.dbp-foot { text-align: center; font-size: 11px; color: var(--ag-muted); margin-top: 8px; }
@media (prefers-reduced-motion: reduce) { .dbp * { animation-duration: .01ms !important; animation-iteration-count: 1 !important; } }
`;

type CritterType = "bunny" | "sock" | "golden" | "cat" | "crumb";

interface Critter {
  cell: Cell;
  el: HTMLElement;
  type: CritterType;
  hit: boolean;
  dead: boolean;
  timer: number;
}

type Cell = HTMLElement & { _critter?: Critter };

interface GameState {
  playing: boolean;
  score: number;
  elapsed: number;
  combo: number;
  spawnT: number;
  toddler: boolean;
  client: boolean;
  stats: { whacked: number; golden: number; cats: number; bestCombo: number };
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** Mounts the game into root. Returns a cleanup function. */
export function mountDustBunnyPanic(
  root: HTMLElement,
  s: DbpStrings,
  onBest: (best: number) => void,
): () => void {
  const timers: number[] = [];
  const abort = new AbortController();
  let loopId = 0;
  let best = readBest(DBP_BEST_KEY) ?? 0;
  const active: Critter[] = [];
  let G: GameState | null = null;

  const later = (fn: () => void, ms: number): number => {
    const id = window.setTimeout(fn, ms);
    timers.push(id);
    return id;
  };

  const nameParts = s.name.split(" ");
  const nameLast = nameParts.pop() ?? "";
  const nameHead = nameParts.join(" ");

  root.innerHTML = `
  <div class="ag dbp">
    <div class="dbp-title">${nameHead} <span class="dbp-zap">${nameLast}</span></div>
    <p class="dbp-sub">${s.tagline}</p>
    <div class="dbp-hud">
      <div class="dbp-scorebox">
        <div class="lbl">${s.score}</div>
        <div class="dbp-score" data-r="score">0</div>
        <div class="dbp-best" data-r="best">${s.best} ${best}</div>
      </div>
      <div class="dbp-timerwrap">
        <div class="dbp-timebar"><div class="dbp-timefill" data-r="fill"></div></div>
        <div class="dbp-secs" data-r="secs"></div>
      </div>
      <div class="dbp-combo" data-r="combo"></div>
    </div>
    <div style="position:relative">
      <div class="dbp-field" data-r="field"></div>
      <div class="dbp-banner" data-r="banner"><span data-r="bannertext"></span></div>
      <div class="dbp-overlay" data-r="startOv">
        <div class="dbp-big">${s.startTitle}</div>
        <p class="dbp-rules">${s.rule1}<br>${s.rule2}<br>${s.rule3}<br>${s.rule4}</p>
        <button class="dbp-btn" data-r="startBtn">${s.start}</button>
      </div>
      <div class="dbp-overlay hidden" data-r="endOv">
        <div class="dbp-big">${s.endTitle}</div>
        <div class="dbp-rank" data-r="rank"></div>
        <p class="dbp-quip" data-r="quip"></p>
        <div class="dbp-stats">
          <div class="dbp-stat"><div class="n" data-r="stWhacked">0</div><div class="l">${s.whacked}</div></div>
          <div class="dbp-stat"><div class="n" data-r="stGolden">0</div><div class="l">${s.golden}</div></div>
          <div class="dbp-stat"><div class="n" data-r="stCats">0</div><div class="l">${s.cats}</div></div>
          <div class="dbp-stat"><div class="n" data-r="stCombo">0</div><div class="l">${s.bestCombo}</div></div>
        </div>
        <button class="dbp-btn" data-r="againBtn">${s.playAgain}</button>
      </div>
    </div>
    <div class="dbp-foot">${s.foot}</div>
  </div>`;

  const $ = (sel: string): HTMLElement => {
    const el = root.querySelector(`[data-r="${sel}"]`);
    if (!el || !(el instanceof HTMLElement)) throw new Error(`missing [data-r=${sel}]`);
    return el;
  };

  const gameRoot = root.querySelector(".dbp") as HTMLElement;
  const scoreEl = $("score");
  const bestEl = $("best");
  const fillEl = $("fill");
  const secsEl = $("secs");
  const comboEl = $("combo");
  const field = $("field");
  const banner = $("banner");
  const bannerText = $("bannertext");
  const startOv = $("startOv");
  const endOv = $("endOv");

  const cells: Cell[] = [];
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div") as Cell;
    cell.className = "dbp-cell";
    cell.innerHTML = '<div class="dbp-mound"></div>';
    cell.addEventListener(
      "pointerdown",
      (ev) => {
        ev.preventDefault();
        whack(cell);
      },
      { signal: abort.signal },
    );
    cell.addEventListener("contextmenu", (ev) => ev.preventDefault(), {
      signal: abort.signal,
    });
    field.appendChild(cell);
    cells.push(cell);
  }

  function bannerShow(text: string): void {
    bannerText.textContent = text;
    banner.classList.remove("show");
    void banner.offsetWidth;
    banner.classList.add("show");
  }

  function mult(): number {
    if (!G) return 1;
    return G.combo >= 8 ? 3 : G.combo >= 4 ? 2 : 1;
  }

  function renderHud(): void {
    if (!G) return;
    scoreEl.textContent = String(G.score);
    const left = Math.max(0, Math.ceil(GAME_SECONDS - G.elapsed));
    secsEl.textContent = s.timeLeft.replace("{s}", String(left));
    fillEl.style.width = `${(left / GAME_SECONDS) * 100}%`;
    fillEl.classList.toggle("low", left <= 8);
    const m = mult();
    comboEl.classList.toggle("on", m > 1);
    if (m > 1) comboEl.textContent = s.combo.replace("{mult}", String(m));
  }

  function floatText(cell: Cell, txt: string, bad: boolean): void {
    const f = document.createElement("div");
    f.className = "dbp-float" + (bad ? " bad" : "");
    f.textContent = txt;
    cell.appendChild(f);
    later(() => f.remove(), 720);
  }

  function taunt(el: HTMLElement, list: string[]): void {
    if (Math.random() > 0.35 || list.length === 0) return;
    const t = document.createElement("div");
    t.className = "dbp-taunt";
    t.textContent = pick(list);
    el.appendChild(t);
    later(() => t.remove(), 1150);
  }

  function spawnInterval(): number {
    if (!G) return 850;
    if (G.elapsed >= 18) return 480;
    if (G.elapsed >= 10) return 640;
    return 850;
  }

  function bunnyInner(type: CritterType): string {
    const eyes = '<div class="dbp-eye l"></div><div class="dbp-eye r"></div><div class="dbp-nose"></div>';
    if (type === "cat") {
      return `<div class="dbp-cat"><div class="dbp-catear l"></div><div class="dbp-catear r"></div><div class="dbp-body"></div><div class="dbp-cateye l"></div><div class="dbp-cateye r"></div><div class="dbp-whisker l1"></div><div class="dbp-whisker l2"></div><div class="dbp-whisker r1"></div><div class="dbp-whisker r2"></div><div class="dbp-catmouth">z z</div></div>`;
    }
    if (type === "crumb") return '<div class="dbp-crumb"></div>';
    const cls = type === "golden" ? "dbp-bunny golden" : "dbp-bunny";
    const sock = type === "sock" ? '<div class="dbp-sock"></div>' : "";
    return `<div class="${cls}">${sock}<div class="dbp-ear l"></div><div class="dbp-ear r"></div><div class="dbp-body"></div>${eyes}</div>`;
  }

  function spawn(): void {
    if (!G) return;
    const free = cells.filter((c) => !c._critter);
    const maxA = G.elapsed >= 18 ? 3 : 2;
    if (free.length === 0 || active.length >= maxA) return;
    const cell = pick(free);
    const r = Math.random();
    const type: CritterType =
      r < 0.15 ? "cat" : r < 0.21 ? "golden" : r < 0.4 ? "sock" : "bunny";
    const life = type === "cat" ? 1500 : Math.max(700, 1100 - G.elapsed * 14);

    const wrap = document.createElement("div");
    wrap.className = "dbp-critter";
    wrap.innerHTML = bunnyInner(type);
    if (type === "cat") taunt(wrap, s.catTaunts);
    else if (type === "golden") taunt(wrap, s.goldenTaunts);
    else taunt(wrap, s.taunts);
    cell.appendChild(wrap);
    const crit: Critter = { cell, el: wrap, type, hit: false, dead: false, timer: 0 };
    cell._critter = crit;
    active.push(crit);
    crit.timer = later(() => escapeCritter(crit), life);
  }

  function escapeCritter(crit: Critter): void {
    if (crit.dead || crit.hit) return;
    crit.dead = true;
    crit.el.classList.add("escaping");
    const c = crit.cell;
    const e = crit.el;
    later(() => {
      e.remove();
      if (c._critter === crit) c._critter = undefined;
    }, 260);
    const ix = active.indexOf(crit);
    if (ix >= 0) active.splice(ix, 1);
  }

  function spawnCrumbs(): void {
    const free = cells.filter((c) => !c._critter);
    const n = Math.min(7, free.length);
    for (let k = 0; k < n; k++) {
      const cell = free.splice(Math.floor(Math.random() * free.length), 1)[0];
      const wrap = document.createElement("div");
      wrap.className = "dbp-critter";
      wrap.innerHTML = bunnyInner("crumb");
      cell.appendChild(wrap);
      const crit: Critter = { cell, el: wrap, type: "crumb", hit: false, dead: false, timer: 0 };
      cell._critter = crit;
      active.push(crit);
      crit.timer = later(() => escapeCritter(crit), 5000);
    }
  }

  function whack(cell: Cell): void {
    if (!G || !G.playing) return;
    const crit = cell._critter;
    if (!crit || crit.dead || crit.hit) {
      if (G.combo > 0) {
        G.combo = 0;
        renderHud();
      }
      sfx.whiff();
      return;
    }
    crit.hit = true;
    window.clearTimeout(crit.timer);
    const ix = active.indexOf(crit);
    if (ix >= 0) active.splice(ix, 1);
    const inner = crit.el.firstElementChild;
    if (inner) inner.classList.add("dbp-squash");

    if (crit.type === "cat") {
      G.score = Math.max(0, G.score - 20);
      G.combo = 0;
      G.stats.cats++;
      floatText(cell, "-20", true);
      sfx.bad();
      gameRoot.classList.remove("shake");
      void gameRoot.offsetWidth;
      gameRoot.classList.add("shake");
      bannerShow(s.catSeen);
    } else {
      const base =
        crit.type === "golden" ? 50 : crit.type === "sock" ? 25 : crit.type === "crumb" ? 5 : 10;
      const pts = base * mult();
      G.score += pts;
      G.combo++;
      G.stats.bestCombo = Math.max(G.stats.bestCombo, G.combo);
      if (crit.type === "golden") {
        G.stats.golden++;
        sfx.golden();
        bannerShow(s.jackpot);
      } else {
        if (crit.type === "bunny" || crit.type === "sock") G.stats.whacked++;
        sfx.pop();
      }
      floatText(cell, `+${pts}`, false);
    }
    renderHud();
    later(() => {
      crit.el.remove();
      if (cell._critter === crit) cell._critter = undefined;
    }, 230);
  }

  function loop(): void {
    if (!G || !G.playing) return;
    G.elapsed += 0.1;
    if (G.elapsed >= 10 && !G.toddler) {
      G.toddler = true;
      bannerShow(s.toddlerEvent);
      spawnCrumbs();
    }
    if (G.elapsed >= 18 && !G.client) {
      G.client = true;
      bannerShow(s.clientEvent);
    }
    G.spawnT -= 100;
    if (G.spawnT <= 0) {
      spawn();
      G.spawnT = spawnInterval() * (0.7 + Math.random() * 0.6);
    }
    renderHud();
    if (G.elapsed >= GAME_SECONDS) endGame();
  }

  function startGame(): void {
    unlockAudio();
    G = {
      playing: true,
      score: 0,
      elapsed: 0,
      combo: 0,
      spawnT: 400,
      toddler: false,
      client: false,
      stats: { whacked: 0, golden: 0, cats: 0, bestCombo: 0 },
    };
    for (const c of active) window.clearTimeout(c.timer);
    active.length = 0;
    for (const cell of cells) {
      if (cell._critter) {
        cell._critter.el.remove();
        cell._critter = undefined;
      }
    }
    startOv.classList.add("hidden");
    endOv.classList.add("hidden");
    renderHud();
    sfx.start();
    if (loopId) window.clearInterval(loopId);
    loopId = window.setInterval(loop, 100);
  }

  function rankFor(score: number): DbpRank {
    const r = s.ranks;
    const fallback = (name: string): DbpRank => ({ name, quip: "" });
    if (score >= 450) return r[0] ?? fallback("Rank 1");
    if (score >= 300) return r[1] ?? fallback("Rank 2");
    if (score >= 150) return r[2] ?? fallback("Rank 3");
    return r[3] ?? fallback("Rank 4");
  }

  function endGame(): void {
    if (!G) return;
    G.playing = false;
    window.clearInterval(loopId);
    loopId = 0;
    for (const c of active) window.clearTimeout(c.timer);
    const rank = rankFor(G.score);
    $("rank").textContent = rank.name;
    $("quip").textContent = rank.quip;
    $("stWhacked").textContent = String(G.stats.whacked);
    $("stGolden").textContent = String(G.stats.golden);
    $("stCats").textContent = String(G.stats.cats);
    $("stCombo").textContent = `x${Math.max(1, G.stats.bestCombo)}`;
    if (G.score > best) {
      best = G.score;
      writeBest(DBP_BEST_KEY, best);
      bestEl.textContent = `${s.best} ${best}`;
      onBest(best);
    }
    endOv.classList.remove("hidden");
    burstConfetti(endOv, 50);
    sfx.fanfare();
  }

  $("startBtn").addEventListener("click", startGame, { signal: abort.signal });
  $("againBtn").addEventListener("click", startGame, { signal: abort.signal });

  return () => {
    abort.abort();
    window.clearInterval(loopId);
    for (const id of timers) window.clearTimeout(id);
    root.innerHTML = "";
  };
}
