import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth";
import { PillNav } from "./pill-nav";

/**
 * PillNav that swaps "Sign in" for "Dashboard" when the visitor has a session.
 *
 * `getSessionUser()` calls `connection()`, which Cache Components cannot
 * prerender. Awaiting it directly in a page makes the whole route block and
 * ship as fully dynamic — losing the prerendered HTML that the marketing
 * pages depend on for SEO.
 *
 * Wrapping it in <Suspense> keeps the static shell prerendered and streams
 * only the nav, so these routes build as Partial Prerender instead. The
 * fallback renders the signed-out nav, which is correct for the majority of
 * visitors and for crawlers.
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