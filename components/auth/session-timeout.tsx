"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ["pointermove", "pointerdown", "keydown", "touchstart", "scroll"] as const;

export function SessionTimeout() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return;
    }

    const supabase = createClient();
    let activityKey: string | null = null;
    let lastActivity = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let signingOut = false;
    let disposed = false;

    function readActivity() {
      if (!activityKey) return lastActivity;
      try {
        const stored = Number(localStorage.getItem(activityKey));
        if (Number.isFinite(stored) && stored > 0) {
          lastActivity = Math.max(lastActivity, stored);
        }
      } catch (cause) {
        console.error("Could not read shared session activity.", cause);
        setError("Session activity cannot be shared between tabs. The inactivity timeout will apply to this tab.");
      }
      return lastActivity;
    }

    function writeActivity(now: number) {
      lastActivity = now;
      if (!activityKey) return;
      try {
        localStorage.setItem(activityKey, String(now));
      } catch (cause) {
        console.error("Could not save shared session activity.", cause);
        setError("Session activity cannot be shared between tabs. The inactivity timeout will apply to this tab.");
      }
    }

    function schedule() {
      clearTimeout(timer);
      if (!activityKey || disposed) return;
      timer = setTimeout(checkExpiry, Math.max(0, IDLE_TIMEOUT_MS - (Date.now() - readActivity())));
    }

    async function expire() {
      if (signingOut || disposed) return;
      signingOut = true;
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (disposed) return;
      if (signOutError) {
        console.error("Automatic sign-out failed.", signOutError);
        setError("Automatic sign-out failed. Retrying shortly; please sign out manually if the problem continues.");
        signingOut = false;
        timer = setTimeout(checkExpiry, 10_000);
        return;
      }
      const next = window.location.pathname + window.location.search;
      // A full navigation discards private data in the client router cache.
      window.location.replace(new URL(`/signin?reason=inactivity&next=${encodeURIComponent(next)}`, window.location.origin).href);
    }

    function checkExpiry() {
      if (!activityKey || signingOut || disposed) return;
      if (Date.now() - readActivity() >= IDLE_TIMEOUT_MS) {
        void expire();
      } else {
        schedule();
      }
    }

    function onActivity() {
      if (!activityKey || signingOut) return;
      const now = Date.now();
      if (now - readActivity() >= IDLE_TIMEOUT_MS) {
        void expire();
        return;
      }
      if (now - lastActivity < 1000) return;
      writeActivity(now);
      schedule();
    }

    function onVisibility() {
      if (document.visibilityState === "visible") checkExpiry();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (disposed) return;
      if (!session) {
        const wasSignedIn = Boolean(activityKey);
        activityKey = null;
        clearTimeout(timer);
        if (event === "SIGNED_OUT" && wasSignedIn && !signingOut) {
          window.location.replace(new URL("/signin", window.location.origin).href);
        }
        return;
      }
      const key = `tidypro:last-activity:${session.user.id}:${session.user.last_sign_in_at}`;
      if (key === activityKey) return;
      activityKey = key;
      lastActivity = 0;
      // Defer auth operations until Supabase releases its auth-event lock.
      timer = setTimeout(() => {
        if (disposed) return;
        if (!readActivity()) writeActivity(Date.now());
        checkExpiry();
      }, 0);
    });

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    window.addEventListener("storage", checkExpiry);
    window.addEventListener("focus", checkExpiry);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      clearTimeout(timer);
      subscription.unsubscribe();
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
      window.removeEventListener("storage", checkExpiry);
      window.removeEventListener("focus", checkExpiry);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return error ? (
    <div role="alert" className="fixed inset-x-4 bottom-4 z-50 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {error}
    </div>
  ) : null;
}
