"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/**
 * Server snapshot is always `false`, which is what React uses for the initial
 * client render too. Reading `window` inside a `useState` lazy initializer
 * would return the real value during hydration and trip a mismatch; this
 * pattern settles on the correct value immediately after hydration instead,
 * with no extra render pass and no setState-in-effect.
 */
function getServerSnapshot() {
  return false;
}

/** Live `prefers-reduced-motion` state. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}