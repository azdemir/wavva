import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadIcon, PhoneIcon } from "@/components/ui/icons";
import { formatCents } from "@/lib/format";
import {
  getFrontOfficeSettings,
  getFrontOfficeStats,
  getFrontOfficeEscalations,
  getFrontOfficeConversations,
  getConversationCustomers,
} from "@/lib/actions/front-office";
import { EscalationQueue } from "@/components/dashboard/front-office/escalation-queue";
import { ConversationLog } from "@/components/dashboard/front-office/conversation-log";

export const metadata: Metadata = {
  title: "Front Office",
};

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
        {hint && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function FrontOfficePage() {
  const [settings, stats, escalations, conversations, convCustomers] =
    await Promise.all([
      getFrontOfficeSettings(),
      getFrontOfficeStats(),
      getFrontOfficeEscalations(),
      getFrontOfficeConversations(),
      getConversationCustomers(),
    ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Front Office
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            What your AI assistant handled this week — and what needs your OK.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href="/dashboard/front-office/setup" variant="outline" size="sm">
            <PhoneIcon className="h-4 w-4" />
            {settings ? "Edit setup" : "Finish setup"}
          </Button>
          <Button href="/api/exports/full" variant="outline" size="sm">
            <DownloadIcon className="h-4 w-4" />
            Full export
          </Button>
        </div>
      </div>

      {!settings && (
        <Card className="border-brand-300 dark:border-brand-800">
          <CardContent>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Your front office isn&apos;t set up yet
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Add your services, prices, service area and customer list so your
              AI assistant can start answering in your company&apos;s name.
            </p>
            <Button href="/dashboard/front-office/setup" className="mt-4">
              Start setup
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Front Office panel — real data */}
      <section aria-labelledby="fo-stats">
        <h2 id="fo-stats" className="sr-only">
          This week
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="New enquiries" value={String(stats.enquiries7d)} hint="Last 7 days" />
          <Stat label="Booked visits" value={String(stats.booked7d)} hint="Last 7 days" />
          <Stat label="Open quotes" value={String(stats.openQuotes)} hint="Awaiting a decision" />
          <Stat
            label="Money collected"
            value={formatCents(stats.collectedCents7d)}
            hint="Last 7 days"
          />
          <Stat
            label="Overdue"
            value={formatCents(stats.overdueCents)}
            hint={`${stats.overdueCount} unpaid invoice${stats.overdueCount === 1 ? "" : "s"}`}
          />
        </div>
      </section>

      {/* Needs your OK */}
      <section aria-labelledby="fo-queue" className="space-y-4">
        <div>
          <h2
            id="fo-queue"
            className="text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            Needs your OK
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Quotes outside your price list and anything unusual, escalated by
            your assistant. Approve, edit, or decline.
          </p>
        </div>
        <EscalationQueue initial={escalations} />
      </section>

      {/* Conversation log */}
      <section aria-labelledby="fo-log" className="space-y-4">
        <div>
          <h2
            id="fo-log"
            className="text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            Conversation log
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Calls, texts and emails handled by your assistant.
            <Link
              href="/api/exports/conversations"
              className="ml-2 font-medium text-brand-700 underline underline-offset-2 dark:text-brand-400"
            >
              Export as spreadsheet
            </Link>
          </p>
        </div>
        <ConversationLog customers={convCustomers} initial={conversations} />
      </section>
    </div>
  );
}
