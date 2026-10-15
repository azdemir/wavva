import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth";
import { PillNav } from "./pill-nav";

/**
 * PillNav that swaps "Sign in" for "Dashboard" when the visitor has a session.
 *
 * `getSessionUser()` reads cookies, which Cache Components cannot prerender.
 * Awaiting it directly in a page makes the whole page dynamic — fatal for the
 * marketing routes, which need to stay statically prerendered for SEO.
 *
 * Wrapping it in <Suspense> keeps the static shell prerendered and streams
 * only the nav, so the page ships as Partial Prerender. The fallback renders
 * the signed-out nav, which is correct for the majority (and for crawlers).
 */
async function SessionAwareNav() {
  const user = await getSessionUser();
  return <PillNav signedIn={!!user} />;
}

export function SessionNav() {
  return (
    <Suspense fallback={<PillNav />}>
      <SessionAwareNav />
    </Suspense>
  );
}