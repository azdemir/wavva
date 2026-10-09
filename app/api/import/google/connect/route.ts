import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { baseUrl } from "@/lib/base-url";
import { encryptionKeyAvailable, signState } from "@/lib/import/encryption";
import {
  buildGoogleAuthUrl,
  isGoogleConfigured,
} from "@/lib/import/providers/google";

const STATE_COOKIE = "tidypro-import-oauth-state-google";

/**
 * Starts the Google Calendar OAuth flow (read-only events scope): stores a
 * signed state cookie (CSRF) and redirects to Google's consent screen.
 */
export async function GET() {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) {
    redirect("/dashboard/import?import_error=not_permitted");
  }
  if (!isGoogleConfigured() || !encryptionKeyAvailable()) {
    redirect("/dashboard/import?import_error=not_configured");
  }

  const url = await baseUrl();
  const redirectUri = `${url}/api/import/google/callback`;
  const { raw, signed } = signState();

  const jar = await cookies();
  jar.set(STATE_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return NextResponse.redirect(buildGoogleAuthUrl(raw, redirectUri));
}
