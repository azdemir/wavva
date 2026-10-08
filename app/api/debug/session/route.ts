import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * TEMPORARY debug route — delete after diagnosing the RLS issue.
 * Visit /api/debug/session while signed in and share the JSON output
 * (it contains no secrets: only the JWT's public claims and query results).
 */
export async function GET() {
  const out: Record<string, unknown> = {
    configured: isSupabaseConfigured(),
    note: "temporary debug route",
  };
  if (!out.configured) return NextResponse.json(out);

  const supabase = await createClient();

  // 1. What session does the server see?
  const { data: sessionData, error: sessErr } =
    await supabase.auth.getSession();
  const token = sessionData.session?.access_token ?? null;
  out.sessionError = sessErr?.message ?? null;
  out.hasSession = !!sessionData.session;
  out.expiresAt = sessionData.session?.expires_at
    ? new Date(sessionData.session.expires_at * 1000).toISOString()
    : null;

  // 2. Decode the JWT's public claims (no signature, no secrets).
  if (token) {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString(),
      );
      out.jwt = {
        sub: payload.sub ?? null,
        role: payload.role ?? null,
        aud: payload.aud ?? null,
        exp: payload.exp
          ? new Date(payload.exp * 1000).toISOString()
          : null,
      };
    } catch {
      out.jwt = "undecodable";
    }
  } else {
    out.jwt = null;
  }

  // 3. Does auth.getUser() see the user?
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  out.userError = userErr?.message ?? null;
  out.userId = userData.user?.id ?? null;

  // 4. Does a plain SELECT work through RLS?
  const { error: selErr } = await supabase
    .from("companies")
    .select("id")
    .limit(1);
  out.selectError = selErr?.message ?? null;

  // 5. Does the exact failing INSERT work? Insert then immediately delete.
  const testName = `[DEBUG TEST ${Date.now()}]`;
  const { data: inserted, error: insErr } = await supabase
    .from("companies")
    .insert({ name: testName })
    .select("id")
    .single();
  out.insertError = insErr?.message ?? null;
  out.insertOk = !insErr && !!inserted;
  if (inserted) {
    await supabase.from("companies").delete().eq("id", inserted.id);
    out.insertCleanedUp = true;
  }

  return NextResponse.json(out);
}
