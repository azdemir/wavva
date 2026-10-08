import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * True when the public Supabase credentials are present. Auth and data
 * pages check this first so a missing .env.local shows a setup notice
 * instead of crashing with a 500.
 */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Carries the user's JWT, so Postgres RLS policies enforce tenant isolation.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component where cookies are read-only;
            // the proxy refreshes the session instead.
          }
        },
      },
    },
  );
}

/**
 * Service-role client. BYPASSES RLS — use only for operations that cannot
 * run as the user, e.g. invite-token lookup. Never expose to the client.
 */
export async function createServiceClient() {
  const { createClient: createSupabaseClient } = await import(
    "@supabase/supabase-js"
  );
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
