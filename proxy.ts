import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 uses `proxy.ts` (the `middleware.ts` convention is deprecated).
 * Refreshes the Supabase auth session on every request so server components
 * always see a valid session. Routing guards live in layouts, not here.
 */
export async function proxy(request: NextRequest) {
  // Expose the current path to server components so auth redirects can
  // preserve the destination (e.g. /signin?next=/dashboard/bookings/new).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "x-pathname",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  const requestInit = { headers: requestHeaders };

  // Without Supabase configured, skip the session refresh entirely so the
  // marketing site still serves (previously this hard-crashed every route).
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next({ request: requestInit });
  }

  let supabaseResponse = NextResponse.next({ request: requestInit });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request: requestInit });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
