/**
 * Shown on the sign-in / sign-up pages when the Supabase credentials are
 * missing, so the page explains the setup step instead of crashing.
 */
export function AuthSetupNotice() {
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      <p className="font-semibold">Sign-in isn&apos;t set up yet</p>
      <p className="mt-1">
        This copy of Wavva isn&apos;t connected to a database. Create a{" "}
        <code className="rounded bg-amber-100 px-1">.env.local</code> file next
        to <code className="rounded bg-amber-100 px-1">.env.example</code> and
        fill in <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
        <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{" "}
        <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
        from your Supabase project&apos;s API settings, then restart the dev
        server.
      </p>
    </div>
  );
}
