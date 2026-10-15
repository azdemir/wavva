"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CameraIcon } from "@/components/ui/icons";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import {
  requestPhotoUpload,
  confirmPhotoUpload,
  deleteJobPhoto,
} from "@/lib/actions/job-photos";

export type JobPhoto = {
  id: string;
  kind: "before" | "after";
  viewUrl: string;
  createdAt: string;
};

type Uploading = {
  id: string;
  kind: "before" | "after";
  preview: string;
  progress: number;
};

/** PUT a file with progress events (fetch has no upload progress). */
function putWithProgress(
  url: string,
  blob: Blob,
  contentType: string,
  onProgress: (pct: number) => void,
  httpFail: (status: number) => string,
  connFail: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(httpFail(xhr.status)));
    xhr.onerror = () => reject(new Error(connFail));
    xhr.send(blob);
  });
}

const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.82;

/**
 * Shrink a phone photo before upload: downscale to at most 1600px on the
 * long edge and re-encode as JPEG. A 5MB camera shot becomes ~200–400KB,
 * so storage stays tiny and uploads are fast on mobile data. Falls back to
 * the original file when the browser can't decode it (e.g. HEIC).
 */
function compressImage(file: File): Promise<{ blob: Blob; contentType: string }> {
  const originalType = file.type || "image/jpeg";
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.width, img.height));
      // Already small enough — keep the original bytes.
      if (scale >= 1 && originalType === "image/jpeg") {
        resolve({ blob: file, contentType: originalType });
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ blob: file, contentType: originalType });
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob ? { blob, contentType: "image/jpeg" } : { blob: file, contentType: originalType }),
        "image/jpeg",
        JPEG_QUALITY,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ blob: file, contentType: originalType });
    };
    img.src = url;
  });
}

function PhotoSection({
  title,
  titleKey,
  description,
  kind,
  photos,
  uploading,
  readOnly,
  onPick,
  onDelete,
  t,
}: {
  title: string;
  titleKey: "before" | "after";
  description: string;
  kind: "before" | "after";
  photos: JobPhoto[];
  uploading: Uploading[];
  readOnly: boolean;
  onPick: (kind: "before" | "after") => void;
  onDelete: (photo: JobPhoto) => void;
  t: (key: string) => string;
}) {
  const kindUploading = uploading.filter((u) => u.kind === kind);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((p) => (
          <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.viewUrl}
              alt={titleKey === "before" ? t("photos.photoAltBefore") : t("photos.photoAltAfter")}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {!readOnly && (
              <ConfirmActionButton
                label={t("photos.deleteLabel")}
                confirmMessage={t("photos.deleteConfirm")}
                className="absolute right-1 top-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-lg font-bold leading-none text-white"
                action={async () => {
                  await onDelete(p);
                }}
              >
                <span aria-hidden="true">×</span>
              </ConfirmActionButton>
            )}
          </div>
        ))}
        {kindUploading.map((u) => (
          <div key={u.id} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u.preview} alt={t("photos.uploadingAlt")} className="h-full w-full object-cover opacity-60" />
            <div className="absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full bg-black/30">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${u.progress}%` }}
              />
            </div>
          </div>
        ))}
        {!readOnly && (
          <button
            type="button"
            onClick={() => onPick(kind)}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-brand-500 dark:hover:text-brand-400"
          >
            <CameraIcon className="h-7 w-7" />
            <span className="px-1 text-center text-xs font-medium leading-tight">
              {t("photos.takePhoto")}
            </span>
          </button>
        )}
      </div>
      {/* Shared hidden input; `capture` opens the camera on phones. Rendered once
          by the parent — sections share it via onPick. */}
    </div>
  );
}

/**
 * Before/after photo capture for a job. Cleaners and owners/managers use the
 * same UI: snap a "before" when arriving, an "after" when the work is done.
 * Files upload straight to object storage via presigned URLs.
 */
export function JobPhotos({
  jobId,
  initial,
  readOnly = false,
}: {
  jobId: string;
  initial: JobPhoto[];
  readOnly?: boolean;
}) {
  const [photos, setPhotos] = useState<JobPhoto[]>(initial);
  const [uploading, setUploading] = useState<Uploading[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pickKind = useRef<"before" | "after">("before");
  const router = useRouter();
  const t = useTranslations("jobs");

  function onPick(kind: "before" | "after") {
    pickKind.current = kind;
    setError(null);
    inputRef.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const kind = pickKind.current;
    if (!file.type.startsWith("image/")) {
      setError(t("photos.notImage"));
      return;
    }
    const tempId = `upload-${Date.now()}`;
    const preview = URL.createObjectURL(file);
    setUploading((u) => [...u, { id: tempId, kind, preview, progress: 0 }]);
    setError(null);
    try {
      // Shrink on-device first so uploads are fast and storage stays tiny.
      const { blob, contentType } = await compressImage(file);
      const req = await requestPhotoUpload(jobId, kind, contentType);
      if (req.error || !req.uploadUrl || !req.storageKey) {
        throw new Error(req.error ?? t("photos.startFail"));
      }
      await putWithProgress(
        req.uploadUrl,
        blob,
        contentType,
        (progress) =>
          setUploading((u) => u.map((x) => (x.id === tempId ? { ...x, progress } : x))),
        (status) => t("photos.httpFail", { status }),
        t("photos.connFail"),
      );
      const done = await confirmPhotoUpload(jobId, kind, req.storageKey, contentType);
      if (done.error || !done.ok) throw new Error(done.error ?? t("photos.saveFail"));
      // Refresh the server-rendered photo list (fresh signed URLs).
      setUploading((u) => u.filter((x) => x.id !== tempId));
      URL.revokeObjectURL(preview);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("photos.uploadFail"));
      setUploading((u) => u.filter((x) => x.id !== tempId));
      URL.revokeObjectURL(preview);
    }
  }

  async function onDelete(photo: JobPhoto) {
    setDeletingId(photo.id);
    const result = await deleteJobPhoto(photo.id);
    setDeletingId(null);
    if (result.error) {
      setError(result.error);
    } else {
      setPhotos((p) => p.filter((x) => x.id !== photo.id));
    }
    return result;
  }

  const before = photos.filter((p) => p.kind === "before");
  const after = photos.filter((p) => p.kind === "after");

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}
      <PhotoSection
        title={t("photos.before")}
        titleKey="before"
        description={t("photos.beforeDesc")}
        kind="before"
        photos={before}
        uploading={uploading}
        readOnly={readOnly}
        onPick={onPick}
        onDelete={onDelete}
        t={t}
      />
      <PhotoSection
        title={t("photos.after")}
        titleKey="after"
        description={t("photos.afterDesc")}
        kind="after"
        photos={after}
        uploading={uploading}
        readOnly={readOnly}
        onPick={onPick}
        onDelete={onDelete}
        t={t}
      />
      {deletingId && <p className="text-xs text-slate-500">{t("photos.deleting")}</p>}
      {/* One shared picker; `capture` opens the camera on phones. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={onFile}
      />
    </div>
  );
}
