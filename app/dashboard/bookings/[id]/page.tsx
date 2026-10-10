import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { rescheduleBooking, cancelBooking } from "@/lib/actions/bookings";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {type JobStatus} from "@/components/ui/badge";
import { TJobStatusPill } from "@/components/ui/translated-status-pill";
import { Field } from "@/components/ui/input";
import { formatTime, formatDate } from "@/lib/format";
import { one } from "@/lib/relations";

function toInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requirePermission("bookings.manage");
  const t = await getTranslations("bookings");
  const supabase = await createClient();
  const tz = company.timezone || "America/New_York";

  // One round trip: the visits come embedded with the parent booking.
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "*, customers(id, name, phone, email), service_addresses(label, address_line1, address_line2, city, state, zip), services(name), quotes(quote_number), jobs(id, scheduled_start, scheduled_end, status)",
    )
    .eq("id", id)
    .eq("company_id", company.id)
    .order("scheduled_start", { referencedTable: "jobs", ascending: true })
    .single();
  if (!booking) notFound();

  const jobs = (booking.jobs ?? []) as {
    id: string;
    scheduled_start: string;
    scheduled_end: string;
    status: string;
  }[];

  const customer = one(booking.customers) as { id: string; name: string; phone: string | null; email: string | null } | null;
  const address = one(booking.service_addresses) as {
    label: string; address_line1: string; address_line2: string | null; city: string; state: string; zip: string;
  } | null;

  const recurrenceLabel =
    booking.recurrence === "weekly"
      ? t("recurrence.weekly")
      : booking.recurrence === "biweekly"
        ? t("recurrence.biweekly")
        : t("recurrence.monthly");

  // Attached checklist template (migration 0015); absent before the migration runs.
  let checklistTemplate: { name: string; items: unknown[] } | null = null;
  const templateId = (booking as { checklist_template_id?: string | null }).checklist_template_id;
  if (templateId) {
    const { data: tpl } = await supabase
      .from("checklist_templates")
      .select("name, items")
      .eq("id", templateId)
      .eq("company_id", company.id)
      .maybeSingle();
    if (tpl) checklistTemplate = { name: tpl.name, items: (tpl.items ?? []) as unknown[] };
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Heading
          title={t("detail.title", { number: booking.booking_number })}
          description={t("detail.description", {
            customer: customer?.name ?? t("detail.customerFallback"),
            frequency:
              booking.recurrence === "none"
                ? t("detail.oneTime")
                : t("detail.repeats", { recurrence: recurrenceLabel }),
          })}
        />
        <TJobStatusPill status={booking.status as JobStatus} className="text-sm" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.details")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300">{t("detail.when")}</p>
            <p className="text-slate-900 dark:text-slate-100">
              {formatDate(booking.scheduled_start)}, {formatTime(booking.scheduled_start, tz)} –{" "}
              {formatTime(booking.scheduled_end, tz)}
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300">{t("detail.service")}</p>
            <p className="text-slate-900 dark:text-slate-100">{one(booking.services)?.name ?? "—"}</p>
          </div>
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300">{t("detail.address")}</p>
            <p className="text-slate-900 dark:text-slate-100">
              {address?.label}: {address?.address_line1}
              {address?.address_line2 ? `, ${address.address_line2}` : ""}, {address?.city},{" "}
              {address?.state} {address?.zip}
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300">{t("detail.customerContact")}</p>
            <p className="text-slate-900 dark:text-slate-100">{[customer?.phone, customer?.email].filter(Boolean).join(" · ") || "—"}</p>
          </div>
          {one(booking.quotes)?.quote_number && (
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">{t("detail.fromQuote")}</p>
              <p className="text-slate-900 dark:text-slate-100">{one(booking.quotes)?.quote_number}</p>
            </div>
          )}
          {checklistTemplate && (
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">{t("detail.checklistTemplate")}</p>
              <p className="text-slate-900 dark:text-slate-100">
                {checklistTemplate.name} · {t("detail.checklistItems", { count: checklistTemplate.items.length })}
              </p>
            </div>
          )}
          {booking.notes && (
            <div className="sm:col-span-2">
              <p className="font-medium text-slate-700 dark:text-slate-300">{t("detail.notes")}</p>
              <p className="text-slate-900 dark:text-slate-100">{booking.notes}</p>
            </div>
          )}
          {booking.cancellation_policy && (
            <div className="sm:col-span-2">
              <p className="font-medium text-slate-700 dark:text-slate-300">{t("detail.cancellationPolicy")}</p>
              <p className="text-slate-600 dark:text-slate-400 dark:text-slate-500">{booking.cancellation_policy}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.visits", { count: (jobs ?? []).length })}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {(jobs ?? []).map((j, i) => (
              <li key={j.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="min-w-0 truncate font-medium text-slate-900 dark:text-slate-100">
                  {t("detail.visit", { n: i + 1 })} — {formatDate(j.scheduled_start)},{" "}
                  {formatTime(j.scheduled_start, tz)} – {formatTime(j.scheduled_end, tz)}
                </span>
                <TJobStatusPill status={j.status as JobStatus} className="shrink-0" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {booking.status !== "canceled" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("detail.reschedule")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                action={async (formData) => {
                  "use server";
                  const r = await rescheduleBooking(
                    id,
                    String(formData.get("start")),
                    String(formData.get("end")),
                  );
                  if (r?.error) throw new Error(r.error);
                }}
                className="flex flex-wrap items-end gap-3"
              >
                <Field id="rs-start" name="start" label={t("detail.newStart")} type="datetime-local" required defaultValue={toInputValue(booking.scheduled_start)} />
                <Field id="rs-end" name="end" label={t("detail.newEnd")} type="datetime-local" required defaultValue={toInputValue(booking.scheduled_end)} />
                <Button type="submit">{t("detail.reschedule")}</Button>
              </form>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
                {t("detail.rescheduleNote")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <form
                action={async () => {
                  "use server";
                  await cancelBooking(id);
                }}
              >
                <Button type="submit" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950">
                  {t("detail.cancelBooking")}
                </Button>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  {t("detail.cancelNote")}
                </p>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      <p className="text-sm">
        <Link href="/dashboard/bookings" className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400">
          {t("detail.allBookings")}
        </Link>
      </p>
    </div>
  );
}
