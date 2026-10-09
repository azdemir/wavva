"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireCompany } from "@/lib/auth";
import { isStaff, NOT_PERMITTED, canWorkJob } from "@/lib/permissions";
import { hasFeature, isPlanId } from "@/lib/plans";
import { logAudit } from "@/lib/audit";
import {
  isStorageConfigured,
  photoStorageKey,
  getPhotoUploadUrl,
  deletePhotoObject,
} from "@/lib/storage";
import { getTranslations } from "next-intl/server";

export type ActionResult = { error?: string; ok?: boolean };

const kindSchema = z.enum(["before", "after"]);

const CONTENT_TYPE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

type Ctx = Awaited<ReturnType<typeof requireCompany>>;

/** Shared gate: staff or assigned cleaner, on a Pro+ plan, with storage set up. */
async function photoContext(jobId: string): Promise<
  | { ctx: Ctx; job: { id: string; assigned_user_ids: string[] | null } }
  | { error: string }
> {
  const ctx = await requireCompany();
  const t = await getTranslations("jobs");
  const plan = isPlanId(ctx.company.plan) ? ctx.company.plan : "starter";
  if (!hasFeature(plan, "photos")) {
    return { error: t("actions.needPro") };
  }
  if (!isStorageConfigured()) {
    return { error: t("actions.noStorage") };
  }
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, assigned_user_ids")
    .eq("id", jobId)
    .eq("company_id", ctx.company.id)
    .single();
  if (!job) return { error: t("actions.jobNotFound") };
  if (!canWorkJob(ctx, job as { assigned_user_ids: string[] | null })) {
    return { error: NOT_PERMITTED };
  }
  return { ctx, job: job as { id: string; assigned_user_ids: string[] | null } };
}

/**
 * Step 1 of the upload: mint a presigned PUT URL. The browser uploads the
 * file straight to object storage; step 2 (confirmPhotoUpload) records it.
 */
export async function requestPhotoUpload(
  jobId: string,
  kind: string,
  contentType: string,
): Promise<{ error?: string; uploadUrl?: string; storageKey?: string }> {
  const gate = await photoContext(jobId);
  if ("error" in gate) return { error: gate.error };
  const t = await getTranslations("jobs");
  const parsedKind = kindSchema.safeParse(kind);
  if (!parsedKind.success) return { error: t("actions.invalidKind") };
  if (!contentType.startsWith("image/")) {
    return { error: t("actions.onlyImages") };
  }
  const ext = CONTENT_TYPE_EXT[contentType] ?? "jpg";
  const photoId = crypto.randomUUID();
  const key = photoStorageKey(
    gate.ctx.company.id,
    jobId,
    parsedKind.data,
    photoId,
    ext,
  );
  const uploadUrl = await getPhotoUploadUrl(key, contentType);
  if (!uploadUrl) return { error: t("actions.noStorage") };
  return { uploadUrl, storageKey: key };
}

/** Step 2: record an uploaded photo after the browser PUT succeeds. */
export async function confirmPhotoUpload(
  jobId: string,
  kind: string,
  storageKey: string,
  contentType: string,
): Promise<{ error?: string; ok?: boolean; photoId?: string }> {
  const gate = await photoContext(jobId);
  if ("error" in gate) return { error: gate.error };
  const t = await getTranslations("jobs");
  const parsedKind = kindSchema.safeParse(kind);
  if (!parsedKind.success) return { error: t("actions.invalidKind") };
  // The key must be one this company/job/kind could have minted.
  const prefix = `job-photos/${gate.ctx.company.id}/${jobId}/${parsedKind.data}/`;
  if (!storageKey.startsWith(prefix) || storageKey.length > prefix.length + 64) {
    return { error: t("actions.invalidKey") };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_photos")
    .insert({
      company_id: gate.ctx.company.id,
      job_id: jobId,
      kind: parsedKind.data,
      storage_key: storageKey,
      content_type: contentType,
      created_by: gate.ctx.membership.user_id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not save the photo." };

  await logAudit(supabase, {
    company_id: gate.ctx.company.id,
    action: `job.photo_${parsedKind.data}`,
    entity_type: "job",
    entity_id: jobId,
    metadata: { photo_id: data.id },
  });
  revalidatePath(`/dashboard/jobs/${jobId}`);
  return { ok: true, photoId: data.id };
}

/** Delete a photo: removes the DB row and the stored object. */
export async function deleteJobPhoto(photoId: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("jobs");
  const plan = isPlanId(ctx.company.plan) ? ctx.company.plan : "starter";
  if (!hasFeature(plan, "photos")) return { error: NOT_PERMITTED };
  const supabase = await createClient();
  const { data: photo } = await supabase
    .from("job_photos")
    .select("id, job_id, storage_key, jobs!inner(assigned_user_ids)")
    .eq("id", photoId)
    .eq("company_id", ctx.company.id)
    .single();
  if (!photo) return { error: t("actions.photoNotFound") };
  const assigned = (photo.jobs as unknown as { assigned_user_ids: string[] | null })
    ?.assigned_user_ids;
  const canDelete = isStaff(ctx.membership.role)
    ? true
    : (assigned ?? []).includes(ctx.membership.user_id);
  if (!canDelete) return { error: NOT_PERMITTED };

  // Best effort on the object; the row must go regardless.
  await deletePhotoObject(photo.storage_key);
  const { error } = await supabase
    .from("job_photos")
    .delete()
    .eq("id", photoId)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "job.photo_deleted",
    entity_type: "job",
    entity_id: photo.job_id,
    metadata: { photo_id: photoId },
  });
  revalidatePath(`/dashboard/jobs/${photo.job_id}`);
  return { ok: true };
}
