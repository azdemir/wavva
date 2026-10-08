import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

/**
 * Platform administrators manage the TidyPro SaaS itself (all companies).
 * Access is granted by email allowlist — set PLATFORM_ADMIN_EMAILS to a
 * comma-separated list. This is intentionally separate from company roles:
 * a company owner is NOT a platform admin.
 */
export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}

export async function requirePlatformAdmin() {
  const user = await getSessionUser();
  if (!user || !isPlatformAdminEmail(user.email)) {
    redirect("/");
  }
  return user;
}
