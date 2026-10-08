import { headers } from "next/headers";

/** Public base URL of the current request (for links in emails). */
export async function baseUrl(): Promise<string> {
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}
