import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  isStorageConfigured,
  deletePhotoObject,
  PHOTO_RETENTION_DAYS,
} from "@/lib/storage";

/**
 * Cron endpoint: deletes job photos older than PHOTO_RETENTION_DAYS
 * (both the stored objects and their DB rows). Schedule it daily
 * (e.g. Vercel Cron, or any scheduler hitting this URL with the
 * CRON_SECRET Bearer <redacted>).
 *
 *   GET /api/cron/photo-cleanup  Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = await createServiceClient();
  const cutoff = new Date(
    Date.now() - PHOTO_RETENTION_DAYS * 24 * 3600 * 1000,
  ).toISOString();

  const { data: photos, error } = await svc
    .from("job_photos")
    .select("id, storage_key")
    .lt("created_at", cutoff)
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const expired = photos ?? [];
  let storageFailures = 0;
  if (isStorageConfigured()) {
    for (const p of expired) {
      try {
        await deletePhotoObject(p.storage_key);
      } catch {
        storageFailures++;
      }
    }
  }
  if (expired.length > 0) {
    const { error: delError } = await svc
      .from("job_photos")
      .delete()
      .in(
        "id",
        expired.map((p) => p.id),
      );
    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    deleted: expired.length,
    storageFailures,
    retentionDays: PHOTO_RETENTION_DAYS,
  });
}
