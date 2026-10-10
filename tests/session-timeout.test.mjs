import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(
  readFileSync("components/auth/session-timeout.tsx", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText;
const timeout = 15 * 60 * 1000;
const session = { user: { id: "test-user", last_sign_in_at: "2026-10-10" } };

function setup(storage = new Map(), signOutError = null) {
  let now = 1_000_000;
  let authCallback;
  let cleanup;
  let signOuts = 0;
  const redirects = [];
  const errors = [];
  const timers = new Map();
  const listeners = new Map();
  let nextTimer = 0;
  const exports = {};
  const window = {
    location: { origin: "http://localhost:3001", pathname: "/dashboard", search: "", replace: (url) => redirects.push(url) },
    addEventListener: (event, callback) => listeners.set(event, callback),
    removeEventListener: (event) => listeners.delete(event),
  };
  runInNewContext(source, {
    exports,
    require: (name) => {
      if (name === "react") return {
        useEffect: (callback) => { cleanup = callback(); },
        useState: () => [null, (message) => errors.push(message)],
      };
      if (name === "react/jsx-runtime") return { jsx: () => null };
      if (name === "@/lib/supabase/client") return {
        createClient: () => ({ auth: {
          onAuthStateChange: (callback) => {
            authCallback = callback;
            return { data: { subscription: { unsubscribe() {} } } };
          },
          signOut: async ({ scope }) => {
            assert.equal(scope, "local");
            signOuts++;
            return { error: signOutError };
          },
        } }),
      };
      throw new Error(`Unexpected import: ${name}`);
    },
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: "test", NEXT_PUBLIC_SUPABASE_ANON_KEY: "test" } },
    window,
    document: { visibilityState: "visible", addEventListener() {}, removeEventListener() {} },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    Date: { now: () => now },
    URL,
    setTimeout: (callback, delay) => { const id = ++nextTimer; timers.set(id, { callback, at: now + delay }); return id; },
    clearTimeout: (id) => timers.delete(id),
    console: { error() {} },
  });
  exports.SessionTimeout();
  async function advance(ms) {
    now += ms;
    for (const [id, timer] of timers) {
      if (timer.at <= now) { timers.delete(id); timer.callback(); }
    }
    await new Promise(setImmediate);
  }
  return {
    login: () => authCallback("INITIAL_SESSION", session),
    event: (name) => listeners.get(name)?.(),
    advance, cleanup, redirects, errors, storage,
    signOuts: () => signOuts,
  };
}

test("signs out at exactly 15 minutes, not before", async () => {
  const app = setup();
  app.login();
  await app.advance(0);
  await app.advance(timeout - 1);
  assert.equal(app.signOuts(), 0);
  await app.advance(1);
  assert.equal(app.signOuts(), 1);
  assert.match(app.redirects[0], /reason=inactivity&next=%2Fdashboard/);
});

test("user input resets the inactivity deadline", async () => {
  const app = setup();
  app.login();
  await app.advance(0);
  await app.advance(10 * 60 * 1000);
  app.event("keydown");
  await app.advance(10 * 60 * 1000);
  assert.equal(app.signOuts(), 0);
  await app.advance(5 * 60 * 1000);
  assert.equal(app.signOuts(), 1);
});

test("persisted activity is shared across tabs and reloads", async () => {
  const storage = new Map();
  const first = setup(storage);
  const second = setup(storage);
  first.login();
  second.login();
  await first.advance(0);
  await second.advance(0);
  await first.advance(10 * 60 * 1000);
  first.event("scroll");
  await second.advance(15 * 60 * 1000);
  assert.equal(second.signOuts(), 0);
  await second.advance(10 * 60 * 1000);
  assert.equal(second.signOuts(), 1);
  const reloaded = setup(storage);
  await reloaded.advance(25 * 60 * 1000);
  reloaded.login();
  await reloaded.advance(0);
  assert.equal(reloaded.signOuts(), 1);
});

test("activity after a sleeping tab expires cannot revive the session", async () => {
  const app = setup();
  app.login();
  await app.advance(0);
  app.cleanup();
  const reloaded = setup(app.storage);
  await reloaded.advance(timeout);
  reloaded.login();
  reloaded.event("pointerdown");
  await reloaded.advance(0);
  assert.equal(reloaded.signOuts(), 1);
});

test("sign-out failures are shown and retried without redirecting", async () => {
  const app = setup(new Map(), { message: "Network unavailable" });
  app.login();
  await app.advance(0);
  await app.advance(timeout);
  assert.equal(app.errors.length, 1);
  assert.equal(app.redirects.length, 0);
  await app.advance(10_000);
  assert.equal(app.signOuts(), 2);
});

test("signed-out visitors have no inactivity timer", async () => {
  const app = setup();
  await app.advance(timeout * 2);
  assert.equal(app.signOuts(), 0);
});
