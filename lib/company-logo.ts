import { createClient, createServiceClient } from "@/lib/supabase/server";
import { deletePhotoObject } from "@/lib/storage";

/**
 * Company logos live in Supabase Storage (public `company-logos` bucket),
 * so uploads need no S3 env vars — just a working Supabase project plus
 * migration 0014. `companies.logo_url` stores the public URL.
 */

/** Logo upload constraints. */
export const MAX_LOGO_BYTES = 500 * 1024;
const LOGO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const BUCKET = "company-logos";

export type LogoUploadError =
  | "not_setup" // bucket missing — migration 0014 not run
  | "invalid_type"
  | "too_large"
  | "upload_failed";

/** Service-role client when available, otherwise the user's own client. */
async function storageClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return createServiceClient();
  return createClient();
}

function logoPath(companyId: string, ext: string): string {
  return `${companyId}/logo.${ext}`;
}

/**
 * Validate and upload a company logo file.
 * Returns the public URL to persist in companies.logo_url, or an error
 * code the caller maps to a translated message. A previous logo under a
 * different path is deleted so orphans don't accumulate.
 */
export async function uploadCompanyLogo(
  companyId: string,
  file: File,
  prevLogoUrl: string | null,
): Promise<{ url?: string; error?: LogoUploadError }> {
  const ext = LOGO_EXT[file.type];
  if (!ext) return { error: "invalid_type" };
  if (file.size > MAX_LOGO_BYTES) return { error: "too_large" };

  const client = await storageClient();
  const path = logoPath(companyId, ext);
  const { error } = await client.storage.from(BUCKET).upload(
    path,
    new Uint8Array(await file.arrayBuffer()),
    { contentType: file.type, upsert: true },
  );
  if (error) {
    // Most likely cause: the bucket doesn't exist (migration not run).
    return { error: "not_setup" };
  }

  const {
    data: { publicUrl },
  } = client.storage.from(BUCKET).getPublicUrl(path);

  if (prevLogoUrl && prevLogoUrl !== publicUrl) {
    await deleteCompanyLogo(prevLogoUrl);
  }
  return { url: publicUrl };
}

/** Remove a stored logo (no-op for missing/legacy values). */
export async function deleteCompanyLogo(
  prevLogoUrl: string | null,
): Promise<void> {
  if (!prevLogoUrl) return;
  const marker = `/${BUCKET}/`;
  const idx = prevLogoUrl.indexOf(marker);
  if (idx >= 0) {
    const path = prevLogoUrl.slice(idx + marker.length).split("?")[0];
    const client = await storageClient();
    await client.storage.from(BUCKET).remove([path]).catch(() => {});
    return;
  }
  // Legacy S3 storage keys (pre-Supabase-Storage logos).
  await deletePhotoObject(prevLogoUrl).catch(() => {});
}

/** True when the given FormData logo entry is an actual chosen file. */
export function hasLogoFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}
