import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { baseUrl } from "@/lib/base-url";
import { verifyState } from "@/lib/import/encryption";
import {
  exchangeJobberCode,
  fetchJobberAccountName,
} from "@/lib/import/providers/jobber";
import { storeOAuthTokens } from "@/lib/actions/import-connections";

const STATE_COOKIE = "tidypro-import-oauth-state-jobber";

/**
 * Jobber OAuth callback: verifies the signed state cookie (CSRF), exchanges
 * the code for tokens, encrypts + stores them, then returns to the import
 * page. Failures redirect back with ?import_error=<code> (shown in the UI).
 */
export async function GET(request: Request) {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) {
    redirect("/dashboard/import?import_error=not_permitted");
  }

  const { searchParams } = new URL(request.url);
  const jar = await cookies();
  const signed = jar.get(STATE_COOKIE)?.value;
  jar.delete(STATE_COOKIE);

  let stateOk = false;
  try {
    stateOk = verifyState(signed ?? "", searchParams.get("state") ?? "");
  } catch {
    stateOk = false;
  }
  if (!stateOk) redirect("/dashboard/import?import_error=state_mismatch");
  if (searchParams.get("error")) redirect("/dashboard/import?import_error=oauth_denied");

  const code = searchParams.get("code");
  if (!code) redirect("/dashboard/import?import_error=oauth_failed");

  try {
    const url = await baseUrl();
    const redirectUri = `${url}/api/import/jobber/callback`;
    const tokens = await exchangeJobberCode(code, redirectUri);
    const accountName = await fetchJobberAccountName(tokens.accessToken);
    await storeOAuthTokens(ctx.company.id, "jobber", {
      ...tokens,
      meta: accountName ? { account_name: accountName } : {},
    });
  } catch {
    redirect("/dashboard/import?import_error=oauth_failed");
  }

  redirect("/dashboard/import?connected=jobber");
}
