import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/relations";
import { startJob, completeJob, cancelJob, saveJobNotes } from "@/lib/actions/jobs";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobStatusPill, type JobStatus } from "@/components/ui/badge";
import { TextareaField } from "@/components/ui/input";
import { JobChecklist, type ChecklistItem } from "@/components/jobs/job-checklist";
import { AssignCrew } from "@/components/jobs/assign-crew";
import { JobPhotos, type JobPhoto } from "@/components/jobs/job-photos";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { hasFeature, isPlanId } from "@/lib/plans";
import { isStorageConfigured, getPhotoViewUrl } from "@/lib/storage";
import { formatTime, formatDate } from "@/lib/format";

export const instant = false;

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company, membership } = await requireCompany();
  const plan = isPlanId(company.plan) ? company.plan : "starter";
  const canUseChecklists = hasFeature(plan, "checklists");
  const canUsePhotos = hasFeature(plan, "photos");
  const storageReady = isStorageConfigured();
  const supabase = await createClient();
  const tz = company.timezone || "America/New_York";
  const isStaff = membership.role === "owner" || membership.role === "manager";

  // Job and roster load in parallel; isStaff is known from requireCompany.
  const [{ data: job }, { data: members }] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "*, customers(name, phone), service_addresses(label, address_line1, address_line2, city, state, zip, access_instructions), bookings(booking_number, notes)",
      )
      .eq("id", id)
      .eq("company_id", company.id)
      .single(),
    isStaff
      ? supabase
          .from("memberships")
          .select("user_id, email, role")
          .eq("company_id", company.id)
          .order("email")
      : Promise.resolve({ data: [] as { user_id: string; email: string; role: string }[] }),
  ]);
  if (!job) notFound();

  const assigned: string[] = job.assigned_user_ids ?? [];
  // Cleaners only see jobs assigned to them.
  if (membership.role === "cleaner" && !assigned.includes(membership.user_id)) {
    notFound();
  }

  const customer = one(job.customers);
  const address = one(job.service_addresses);
  const booking = one(job.bookings);
  const checklist = (job.checklist ?? []) as ChecklistItem[];

  // Before/after photos with fresh signed view URLs (1h expiry).
  let photos: JobPhoto[] = [];
  if (canUsePhotos && storageReady) {
    const { data: rows } = await supabase
      .from("job_photos")
      .select("id, kind, storage_key, created_at")
      .eq("job_id", id)
      .eq("company_id", company.id)
      .order("created_at", { ascending: true });
    photos = (
      await Promise.all(
        (rows ?? []).map(async (r) => ({
          id: r.id,
          kind: r.kind as "before" | "after",
          viewUrl: await getPhotoViewUrl(r.storage_key),
          createdAt: r.created_at,
        })),
      )
    ).filter((p): p is JobPhoto => p.viewUrl !== null);
  }
  const readOnly = job.status === "completed" || job.status === "canceled";
  const whenLabel =
    job.scheduled_start === job.scheduled_end
      ? `${formatDate(job.scheduled_start)}, ${formatTime(job.scheduled_start, tz)}`
      : `${formatDate(job.scheduled_start)}, ${formatTime(job.scheduled_start, tz)} – ${formatTime(job.scheduled_end, tz)}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Heading
          title={customer?.name ?? "Job"}
          description={whenLabel}
        />
        <JobStatusPill status={job.status as JobStatus} className="text-sm" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visit details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="font-medium text-slate-700 dark:text-slate-300">Address: </span>
            {address?.label}: {address?.address_line1}
            {address?.address_line2 ? `, ${address.address_line2}` : ""}, {address?.city},{" "}
            {address?.state} {address?.zip}
          </p>
          {customer?.phone && (
            <p>
              <span className="font-medium text-slate-700 dark:text-slate-300">Customer phone: </span>
              <a href={`tel:${customer.phone}`} className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400">
                {customer.phone}
              </a>
            </p>
          )}
          {address?.access_instructions && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
              <p className="font-medium text-amber-800">Access instructions</p>
              <p className="text-amber-900">{address.access_instructions}</p>
            </div>
          )}
          {booking?.notes && (
            <p>
              <span className="font-medium text-slate-700 dark:text-slate-300">Booking notes: </span>
              {booking.notes}
            </p>
          )}
          {booking?.booking_number && (
            <p>
              <span className="font-medium text-slate-700 dark:text-slate-300">Booking: </span>
              <Link href={`/dashboard/bookings/${job.booking_id}`} className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400">
                {booking.booking_number}
              </Link>
            </p>
          )}
          {job.started_at && (
            <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500">Started {formatTime(job.started_at, tz)}</p>
          )}
          {job.completed_at && (
            <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500">Completed {formatTime(job.completed_at, tz)}</p>
          )}
        </CardContent>
      </Card>

      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {job.status === "scheduled" && (
                <form action={async () => { "use server"; await startJob(id); }}>
                  <Button type="submit">Start job</Button>
                </form>
              )}
              {isStaff && (
                <form action={async () => { "use server"; await cancelJob(id); }} className="ml-auto">
                  <Button type="submit" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950">
                    Cancel job
                  </Button>
                </form>
              )}
            </div>
            {(job.status === "scheduled" || job.status === "in_progress") && (
              <form
                action={async (formData) => {
                  "use server";
                  await completeJob(id, formData);
                }}
                className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800"
              >
                <TextareaField
                  id="job-notes"
                  name="notes"
                  label="Completion notes (optional)"
                  rows={3}
                  defaultValue={job.completion_notes ?? ""}
                  placeholder="Anything the customer should know…"
                />
                <Button type="submit" variant="outline" className="w-full border-accent-300 text-accent-700 hover:bg-accent-50 dark:border-accent-800 dark:text-accent-400 dark:hover:bg-accent-950 sm:w-auto">
                  Complete job
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          {canUseChecklists ? (
            <JobChecklist jobId={id} initial={checklist} readOnly={readOnly} />
          ) : (
            <UpgradePrompt feature="checklists" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Before / after photos</CardTitle>
        </CardHeader>
        <CardContent>
          {!canUsePhotos ? (
            <UpgradePrompt feature="photos" />
          ) : !storageReady ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isStaff
                ? "Photo uploads need object storage. Set STORAGE_BUCKET, STORAGE_ENDPOINT, STORAGE_ACCESS_KEY_ID, and STORAGE_SECRET_ACCESS_KEY to enable them."
                : "Photo uploads aren't enabled yet — ask your manager."}
            </p>
          ) : (
            <JobPhotos jobId={id} initial={photos} readOnly={readOnly} />
          )}
        </CardContent>
      </Card>

      {isStaff && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned crew</CardTitle>
          </CardHeader>
          <CardContent>
            {canUseChecklists ? (
              <AssignCrew jobId={id} crew={members ?? []} assigned={assigned} />
            ) : (
              <UpgradePrompt feature="checklists" />
            )}
          </CardContent>
        </Card>
      )}

      {isStaff && (
        <Card>
          <CardHeader>
            <CardTitle>Internal notes</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                "use server";
                await saveJobNotes(id, formData);
              }}
              className="space-y-3"
            >
              <TextareaField
                id="job-internal-notes"
                name="notes"
                label="Notes"
                rows={3}
                defaultValue={job.completion_notes ?? ""}
              />
              <Button type="submit" variant="outline">Save notes</Button>
            </form>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
              Photo documentation unlocks once object storage is configured.
            </p>
          </CardContent>
        </Card>
      )}

      <p className="text-sm">
        <Link href="/dashboard/schedule" className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400">
          ← Schedule
        </Link>
      </p>
    </div>
  );
}
