"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireCompany } from "@/lib/auth";
import { isStaff, NOT_PERMITTED, canWorkJob } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { one } from "@/lib/relations";
import { baseUrl } from "@/lib/base-url";
import { formatDate, formatTime } from "@/lib/format";
import { enqueueCustomerNotification } from "@/lib/communications/notify";
import { getOrCreatePortalLink } from "@/lib/actions/portal";
import { getTranslations } from "next-intl/server";

export type ActionResult = { error?: string; ok?: boolean };

async function getJob(id: string, companyId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("id, status, assigned_user_ids")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();
  return { supabase, job: data as { id: string; status: string; assigned_user_ids: string[] | null } | null };
}

export async function startJob(id: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("jobs");
  const { supabase, job } = await getJob(id, ctx.company.id);
  if (!job) return { error: t("actions.jobNotFound") };
  if (!canWorkJob(ctx, job)) return { error: NOT_PERMITTED };
  if (job.status !== "scheduled") return { error: t("actions.onlyScheduled") };

  const { error } = await supabase
    .from("jobs")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "job.started",
    entity_type: "job",
    entity_id: id,
  });
  revalidatePath(`/dashboard/jobs/${id}`);
  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard/my-jobs");
  return { ok: true };
}

export async function completeJob(id: string, formData: FormData): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("jobs");
  const { supabase, job } = await getJob(id, ctx.company.id);
  if (!job) return { error: t("actions.jobNotFound") };
  if (!canWorkJob(ctx, job)) return { error: NOT_PERMITTED };
  if (!["scheduled", "in_progress"].includes(job.status)) {
    return { error: t("actions.cantComplete") };
  }

  const { error } = await supabase
    .from("jobs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      completion_notes: String(formData.get("notes") || "") || null,
    })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "job.completed",
    entity_type: "job",
    entity_id: id,
  });

  // Thank the customer and ask for a review.
  const { data: doneJob } = await supabase
    .from("jobs")
    .select("scheduled_start, customer_id, customers(name, email, phone, sms_consent)")
    .eq("id", id)
    .single();
  const doneCustomer = one(doneJob?.customers) as {
    name: string;
    email: string | null;
    phone: string | null;
    sms_consent: boolean | null;
  } | null;
  if (doneJob && doneCustomer) {
    const bUrl = await baseUrl();
    const portal = await getOrCreatePortalLink(doneJob.customer_id, bUrl);
    await enqueueCustomerNotification(supabase, {
      company_id: ctx.company.id,
      recipient_type: "customer",
      recipient_id: doneJob.customer_id,
      template: "job_completed",
      payload: {
        recipient_name: doneCustomer.name,
        company_name: ctx.company.name,
        date: formatDate(doneJob.scheduled_start),
        portal_link: portal.link,
      },
      contact: {
        email: doneCustomer.email,
        phone: doneCustomer.phone,
        smsConsent: doneCustomer.sms_consent ?? false,
      },
    });
  }

  revalidatePath(`/dashboard/jobs/${id}`);
  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard/my-jobs");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function cancelJob(id: string): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("jobs");
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const { supabase, job } = await getJob(id, ctx.company.id);
  if (!job) return { error: t("actions.jobNotFound") };
  if (job.status === "completed") return { error: t("actions.cantCancel") };

  const { error } = await supabase
    .from("jobs")
    .update({ status: "canceled" })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "job.canceled",
    entity_type: "job",
    entity_id: id,
  });

  // Tell the assigned crew the job was cancelled.
  const cancelledIds = (job.assigned_user_ids ?? []) as string[];
  if (cancelledIds.length > 0) {
    const [{ data: cancelledJob }, { data: cancelledAssignees }] = await Promise.all([
      supabase
        .from("jobs")
        .select("scheduled_start, scheduled_end, customers(name), service_addresses(address_line1, city)")
        .eq("id", id)
        .single(),
      supabase
        .from("memberships")
        .select("user_id, email")
        .eq("company_id", ctx.company.id)
        .in("user_id", cancelledIds),
    ]);
    const cancelTz = ctx.company.timezone || "America/New_York";
    const cName = one(cancelledJob?.customers)?.name ?? "";
    const cAddr = one(cancelledJob?.service_addresses);
    for (const a of cancelledAssignees ?? []) {
      if (!a.email) continue;
      await enqueueCustomerNotification(supabase, {
        company_id: ctx.company.id,
        recipient_type: "user",
        recipient_id: a.user_id,
        template: "job_cancelled",
        payload: {
          company_name: ctx.company.name,
          date: formatDate(cancelledJob?.scheduled_start ?? ""),
          time: cancelledJob
            ? `${formatTime(cancelledJob.scheduled_start, cancelTz)} – ${formatTime(cancelledJob.scheduled_end, cancelTz)}`
            : undefined,
          customer_name: cName,
          address: `${cAddr?.address_line1 ?? ""}, ${cAddr?.city ?? ""}`,
        },
        contact: { email: a.email },
        skipConsentCheck: true,
      });
    }
  }

  revalidatePath(`/dashboard/jobs/${id}`);
  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard/my-jobs");
  return { ok: true };
}

/** Replace the crew assigned to a job. */
export async function assignJob(id: string, userIds: string[]): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("jobs");
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const supabase = await createClient();

  // Every assignee must be a member of this company.
  if (userIds.length > 0) {
    const { data: members } = await supabase
      .from("memberships")
      .select("user_id")
      .eq("company_id", ctx.company.id)
      .in("user_id", userIds);
    const valid = new Set((members ?? []).map((m) => m.user_id));
    const invalid = userIds.filter((u) => !valid.has(u));
    if (invalid.length > 0) return { error: t("actions.badAssignees") };
  }

  const { error } = await supabase
    .from("jobs")
    .update({ assigned_user_ids: userIds })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };

  await logAudit(supabase, {
    company_id: ctx.company.id,
    action: "job.assigned",
    entity_type: "job",
    entity_id: id,
    metadata: { assigned_user_ids: userIds },
  });

  if (userIds.length > 0) {
    // Job details and assignee emails are independent — fetch together.
    const [{ data: jobFull }, { data: assignees }] = await Promise.all([
      supabase
        .from("jobs")
        .select("scheduled_start, scheduled_end, customers(name), service_addresses(address_line1, city)")
        .eq("id", id)
        .single(),
      supabase
        .from("memberships")
        .select("user_id, email")
        .eq("company_id", ctx.company.id)
        .in("user_id", userIds),
    ]);
    const bUrl = await baseUrl();
    const tz2 = ctx.company.timezone || "America/New_York";
    for (const a of assignees ?? []) {
      if (!a.email) continue;
      await enqueueCustomerNotification(supabase, {
        company_id: ctx.company.id,
        recipient_type: "user",
        recipient_id: a.user_id,
        template: "job_assigned",
        payload: {
          company_name: ctx.company.name,
          date: formatDate(jobFull?.scheduled_start ?? ""),
          time: jobFull ? `${formatTime(jobFull.scheduled_start, tz2)} – ${formatTime(jobFull.scheduled_end, tz2)}` : undefined,
          customer_name: one(jobFull?.customers)?.name,
          address: `${one(jobFull?.service_addresses)?.address_line1 ?? ""}, ${one(jobFull?.service_addresses)?.city ?? ""}`,
          job_link: `${bUrl}/dashboard/jobs/${id}`,
        },
        contact: { email: a.email },
        // Team members: no phone numbers are collected yet, so the SMS
        // channel stays dormant for crew until then.
        skipConsentCheck: true,
      });
    }
  }

  revalidatePath(`/dashboard/jobs/${id}`);
  revalidatePath("/dashboard/schedule");
  return { ok: true };
}

const checklistItem = z.object({ label: z.string().min(1).max(200), done: z.boolean() });

/** Replace the job's checklist (used by the interactive checklist UI). */
export async function saveChecklist(id: string, items: unknown): Promise<ActionResult> {
  const ctx = await requireCompany();
  const t = await getTranslations("jobs");
  const parsed = checklistItem.array().max(100).safeParse(items);
  if (!parsed.success) return { error: t("actions.invalidChecklist") };

  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("assigned_user_ids")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .single();
  if (!job) return { error: t("actions.jobNotFound") };
  if (!canWorkJob(ctx, job as { assigned_user_ids: string[] | null })) {
    return { error: NOT_PERMITTED };
  }

  const { error } = await supabase
    .from("jobs")
    .update({ checklist: parsed.data })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/jobs/${id}`);
  return { ok: true };
}

export async function saveJobNotes(id: string, formData: FormData): Promise<ActionResult> {
  const ctx = await requireCompany();
  if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ completion_notes: String(formData.get("notes") || "") || null })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/jobs/${id}`);
  return { ok: true };
}
