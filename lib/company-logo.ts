import {
  isStorageConfigured,
  logoStorageKey,
  putLogoObject,
  deletePhotoObject,
} from "@/lib/storage";

/** Logo upload constraints. */
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export type LogoUploadError =
  | "storage_not_configured"
  | "invalid_type"
  | "too_large"
  | "upload_failed";

/**
 * Validate and upload a company logo file to storage.
 * Returns the storage key to persist in companies.logo_url, or an error
 * code the caller maps to a translated message. A previous logo stored
 * under a different key is deleted so orphans don't accumulate.
 */
export async function uploadCompanyLogo(
  companyId: string,
  file: File,
  prevLogoUrl: string | null,
): Promise<{ key?: string; error?: LogoUploadError }> {
  if (!isStorageConfigured()) return { error: "storage_not_configured" };
  const ext = LOGO_EXT[file.type];
  if (!ext) return { error: "invalid_type" };
  if (file.size > MAX_LOGO_BYTES) return { error: "too_large" };

  const key = logoStorageKey(companyId, ext);
  const ok = await putLogoObject(
    key,
    new Uint8Array(await file.arrayBuffer()),
    file.type,
  );
  if (!ok) return { error: "upload_failed" };

  if (prevLogoUrl && !/^https?:\/\//i.test(prevLogoUrl) && prevLogoUrl !== key) {
    await deletePhotoObject(prevLogoUrl).catch(() => {});
  }
  return { key };
}

/** Remove a stored logo object (no-op for manual http URLs or missing storage). */
export async function deleteCompanyLogo(
  prevLogoUrl: string | null,
): Promise<void> {
  if (!prevLogoUrl || /^https?:\/\//i.test(prevLogoUrl)) return;
  await deletePhotoObject(prevLogoUrl).catch(() => {});
}

/** True when the given FormData logo entry is an actual chosen file. */
export function hasLogoFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}
