import { cacheTag } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { CONTENT_DEFAULTS } from "./registry";

/**
 * Reads the site_content overrides and merges them over the registry
 * defaults. Deliberately cookie-free (plain anon client, no @supabase/ssr):
 * marketing pages stay statically prerendered, and Studio saves go live via
 * updateTag("site-content") + revalidatePath in the save action.
 *
 * The fetch is wrapped in "use cache" so prerendering never trips over
 * uncached runtime data; the tag lets Studio purge it on save.
 *
 * Never throws — without Supabase configured (or on any error) the site
 * renders the registry defaults.
 */
async function fetchOverrides(): Promise<Record<string, unknown>> {
  "use cache";
  cacheTag("site-content");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return {};
  try {
    const sb = createSupabaseClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb.from("site_content").select("key, value");
    if (error || !data) return {};
    return Object.fromEntries(
      (data as { key: string; value: unknown }[])
        .filter((r) => typeof r.key === "string")
        .map((r) => [r.key, r.value]),
    );
  } catch {
    // Render defaults; Studio will show the DB as unreachable.
    return {};
  }
}

/** Typed read of one content key (registry default when not overridden). */
export async function getContent<T>(key: string): Promise<T> {
  const overrides = await fetchOverrides();
  if (key in overrides) return overrides[key] as T;
  return CONTENT_DEFAULTS[key] as T;
}

/**
 * Raw DB overrides only — used by the Studio editor for "customized" badges.
 * Uncached on purpose: the editor must always show the latest saved state.
 */
export async function getContentOverrides(): Promise<Record<string, unknown>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return {};
  try {
    const sb = createSupabaseClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb.from("site_content").select("key, value");
    if (error || !data) return {};
    return Object.fromEntries(
      (data as { key: string; value: unknown }[]).map((r) => [r.key, r.value]),
    );
  } catch {
    return {};
  }
}
