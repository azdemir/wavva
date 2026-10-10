import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * S3-compatible object storage (Supabase Storage, Cloudflare R2, AWS S3, …)
 * for job photos. (Company logos use Supabase Storage directly via
 * lib/company-logo.ts, so they need no S3 env vars.)
 *
 * Browsers upload straight to storage via presigned PUT URLs, so large phone
 * photos never pass through the app server. All signing happens here,
 * server-side — credentials never reach the client.
 */

/** Job photos are automatically deleted this many days after upload. */
export const PHOTO_RETENTION_DAYS = 7;

type StorageConfig = {
  bucket: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

function config(): StorageConfig {
  return {
    bucket: process.env.STORAGE_BUCKET ?? "",
    endpoint: process.env.STORAGE_ENDPOINT ?? "",
    region: process.env.STORAGE_REGION ?? "us-east-1",
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? "",
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE !== "false",
  };
}

/** True when all storage env vars are present. */
export function isStorageConfigured(): boolean {
  const c = config();
  return Boolean(c.bucket && c.endpoint && c.accessKeyId && c.secretAccessKey);
}

let client: S3Client | null = null;

function getClient(): S3Client | null {
  if (!isStorageConfigured()) return null;
  if (!client) {
    const c = config();
    client = new S3Client({
      region: c.region,
      endpoint: c.endpoint,
      forcePathStyle: c.forcePathStyle,
      credentials: {
        accessKeyId: c.accessKeyId,
        secretAccessKey: c.secretAccessKey,
      },
    });
  }
  return client;
}

/** Deterministic object key for a job photo. */
export function photoStorageKey(
  companyId: string,
  jobId: string,
  kind: "before" | "after",
  photoId: string,
  ext: string,
): string {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").slice(0, 5) || "jpg";
  return `job-photos/${companyId}/${jobId}/${kind}/${photoId}.${safeExt}`;
}

/** Presigned URL the browser PUTs the photo to (valid 15 minutes). */
export async function getPhotoUploadUrl(
  key: string,
  contentType: string,
): Promise<string | null> {
  const s3 = getClient();
  if (!s3) return null;
  const { bucket } = config();
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: 15 * 60 },
  );
}

/** Presigned URL for viewing a photo (valid 1 hour). */
export async function getPhotoViewUrl(key: string): Promise<string | null> {
  const s3 = getClient();
  if (!s3) return null;
  const { bucket } = config();
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: 60 * 60,
  });
}

/**
 * Resolve a stored companies.logo_url to a viewable URL.
 * - http(s) values (Supabase Storage public URLs, manually entered URLs)
 *   are returned as-is.
 * - anything else is treated as a legacy S3 storage key and gets a
 *   presigned GET URL.
 */
export async function getLogoViewUrl(
  logoUrl: string | null | undefined,
): Promise<string | null> {
  if (!logoUrl) return null;
  if (/^https?:\/\//i.test(logoUrl)) return logoUrl;
  return getPhotoViewUrl(logoUrl);
}

/** Delete a photo object. Returns false when storage isn't configured. */
export async function deletePhotoObject(key: string): Promise<boolean> {
  const s3 = getClient();
  if (!s3) return false;
  const { bucket } = config();
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  return true;
}
