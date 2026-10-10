"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { startJob } from "@/lib/actions/jobs";

/**
 * Starts a job with immediate "Starting…" feedback. On success the page
 * refreshes into the in-progress state (started time + elapsed), so the
 * button is visibly replaced by the job's active state instead of just
 * disappearing.
 */
export function StartJobButton({ jobId }: { jobId: string }) {
  const t = useTranslations("jobs");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await startJob(jobId);
            if (result?.error) {
              setError(result.error);
              return;
            }
            router.refresh();
          })
        }
      >
        {pending ? t("detail.starting") : t("detail.start")}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
