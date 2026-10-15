"use client";

import { useMemo, useState } from "react";
import { studioSetCompanyTier } from "@/lib/studio/actions";
import type { StudioCompany, TierChangeEntry } from "@/lib/studio/tiers";
import {
  PLANS,
  PLAN_IDS,
  formatPrice,
  hasFeature,
  seatLimitLabel,
  type PlanFeature,
  type PlanId,
} from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const tierTones = { essential: "amber", complete: "brand" } as const;

/** Active customers included per plan — both Wavva tiers are unlimited. */
const CUSTOMER_CAPS: Partial<Record<PlanId, number>> = {};

const FEATURE_LABELS: { key: PlanFeature; label: string }[] = [
  { key: "schedule", label: "Week schedule view" },
  { key: "checklists", label: "Job checklists & crew assignment" },
  { key: "reports", label: "Business reports" },
  { key: "photos", label: "Before/after job photos" },
  { key: "communications", label: "Automated SMS & email templates" },
  { key: "integrations", label: "Mailchimp & Zapier integrations" },
  { key: "quickbooks", label: "QuickBooks accounting sync" },
];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function planName(id: string) {
  return (PLANS as Record<string, { name: string }>)[id]?.name ?? id;
}

/** Platform-admin subscription-tier management with audit log. */
export function TierManager({
  companies,
  log,
}: {
  companies: StudioCompany[];
  log: TierChangeEntry[];
}) {
  const [companyList, setCompanyList] = useState(companies);
  const [entries, setEntries] = useState(log);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingTier, setPendingTier] = useState<PlanId | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companyList;
    return companyList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.ownerEmail.toLowerCase().includes(q) ||
        c.memberEmails.some((e) => e.toLowerCase().includes(q)),
    );
  }, [companyList, query]);

  const selected = useMemo(
    () => companyList.find((c) => c.companyId === selectedId) ?? null,
    [companyList, selectedId],
  );

  function selectCompany(id: string) {
    setSelectedId(id);
    setPendingTier(null);
    setConfirming(false);
    setError(null);
    setSuccess(null);
  }

  function pickTier(tier: PlanId) {
    setPendingTier(tier);
    setConfirming(false);
    setError(null);
    setSuccess(null);
  }

  async function doConfirm() {
    if (!selected || !pendingTier) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const r = await studioSetCompanyTier(selected.companyId, pendingTier);
      if (!r.ok) throw new Error(r.error ?? "Couldn't change the tier.");
      // The explicit change is now the source of truth for this company.
      setCompanyList((list) =>
        list.map((c) =>
          c.companyId === selected.companyId
            ? { ...c, storedPlan: pendingTier, effectivePlan: pendingTier, grantApplies: false }
            : c,
        ),
      );
      setEntries((list) => [
        {
          id: `local-${Date.now()}`,
          companyId: selected.companyId,
          companyName: selected.name,
          affectedUserEmail: selected.ownerEmail,
          previousTier: r.previousTier ?? selected.effectivePlan,
          newTier: r.newTier ?? pendingTier,
          adminEmail: "you",
          createdAt: new Date().toISOString(),
        },
        ...list,
      ]);
      setSuccess(
        `${selected.name} is now on the ${planName(pendingTier)} tier (was ${planName(r.previousTier ?? selected.effectivePlan)}).`,
      );
      setConfirming(false);
      setPendingTier(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't change the tier.");
    } finally {
      setBusy(false);
    }
  }

  const warnings = useMemo(() => {
    if (!selected || !pendingTier) return [];
    const out: string[] = [];
    const seats = PLANS[pendingTier].seats;
    if (seats !== null && selected.memberCount > seats) {
      out.push(
        `${selected.name} has ${selected.memberCount} team member${selected.memberCount === 1 ? "" : "s"}, but ${PLANS[pendingTier].name} allows ${seatLimitLabel(pendingTier)} — new invites will be blocked until they're under the limit.`,
      );
    }
    const cap = CUSTOMER_CAPS[pendingTier];
    if (cap !== undefined && selected.customerCount > cap) {
      out.push(
        `${selected.name} has ${selected.customerCount} customers; ${PLANS[pendingTier].name} includes up to ${cap} active customers.`,
      );
    }
    const lost = FEATURE_LABELS.filter(
      (f) => hasFeature(selected.effectivePlan, f.key) && !hasFeature(pendingTier, f.key),
    );
    if (lost.length > 0) {
      out.push(`They will lose: ${lost.map((f) => f.label).join(", ")}.`);
    }
    if (selected.grantApplies && pendingTier !== "complete") {
      out.push(
        "This company currently gets Complete through the founder all-access grant. Saving makes the new tier explicit — the grant will no longer apply to them.",
      );
    }
    return out;
  }, [selected, pendingTier]);

  const gained = useMemo(() => {
    if (!selected || !pendingTier) return [];
    return FEATURE_LABELS.filter(
      (f) => !hasFeature(selected.effectivePlan, f.key) && hasFeature(pendingTier, f.key),
    );
  }, [selected, pendingTier]);

  return (
    <div className="space-y-6">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200"
        >
          {success}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Company picker */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>
                Companies ({filtered.length}
                {query ? ` of ${companyList.length}` : ""})
              </CardTitle>
            </div>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company or user email…"
              aria-label="Search companies"
              className="mt-3 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </CardHeader>
          <CardContent className="max-h-[480px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {companyList.length === 0 ? "No companies yet." : "No companies match your search."}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((c) => (
                  <li key={c.companyId}>
                    <button
                      type="button"
                      onClick={() => selectCompany(c.companyId)}
                      aria-pressed={selectedId === c.companyId}
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                        selectedId === c.companyId ? "bg-slate-50 dark:bg-slate-800/60" : ""
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-slate-900 dark:text-slate-100">
                          {c.name}
                        </span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                          {c.ownerEmail} · {c.memberCount} member{c.memberCount === 1 ? "" : "s"}
                        </span>
                      </span>
                      <Badge tone={tierTones[c.effectivePlan]} className="shrink-0">
                        {PLANS[c.effectivePlan].name}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Tier detail + picker */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{selected ? selected.name : "Select a company"}</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Pick a company on the left to see its current tier and assign a new one.
              </p>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <span>
                    Owner: <span className="font-medium text-slate-900 dark:text-slate-100">{selected.ownerEmail}</span>
                  </span>
                  <span>
                    {selected.memberCount} member{selected.memberCount === 1 ? "" : "s"} ·{" "}
                    {selected.customerCount} customer{selected.customerCount === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Current tier:</span>
                  <Badge tone={tierTones[selected.effectivePlan]}>
                    {PLANS[selected.effectivePlan].name}
                  </Badge>
                  {selected.grantApplies ? (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      via founder all-access grant
                      {selected.storedPlan && selected.storedPlan !== selected.effectivePlan
                        ? ` (stored: ${planName(selected.storedPlan)})`
                        : ""}
                      {" "}— an explicit change below overrides the grant.
                    </span>
                  ) : (
                    selected.storedPlan && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatPrice(PLANS[selected.effectivePlan].priceCents)}/mo ·{" "}
                        {seatLimitLabel(selected.effectivePlan)}
                      </span>
                    )
                  )}
                </div>

                <div
                  role="radiogroup"
                  aria-label="Assign tier"
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {PLAN_IDS.map((id) => {
                    const p = PLANS[id];
                    const isCurrent = id === selected.effectivePlan;
                    const isPicked = id === pendingTier;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={isPicked}
                        disabled={busy || isCurrent}
                        onClick={() => pickTier(id)}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                          isPicked
                            ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500 dark:bg-brand-950/40"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                        } ${isCurrent || busy ? "cursor-default opacity-70" : "cursor-pointer"}`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {p.name}
                          </span>
                          {isCurrent ? (
                            <Badge tone={tierTones[id]}>Current</Badge>
                          ) : (
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                              {formatPrice(p.priceCents)}/mo
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                          {seatLimitLabel(id)}
                          {CUSTOMER_CAPS[id] ? ` · up to ${CUSTOMER_CAPS[id]} customers` : " · unlimited customers"}
                        </span>
                        <span className="mt-2 block space-y-1">
                          {p.features.slice(0, 4).map((f) => (
                            <span
                              key={f}
                              className="block text-xs text-slate-600 dark:text-slate-300"
                            >
                              · {f}
                            </span>
                          ))}
                          {p.features.length > 4 && (
                            <span className="block text-xs text-slate-400 dark:text-slate-500">
                              +{p.features.length - 4} more
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {pendingTier && !confirming && (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setConfirming(true)} disabled={busy}>
                      Review change to {PLANS[pendingTier].name}…
                    </Button>
                    <Button variant="ghost" onClick={() => setPendingTier(null)} disabled={busy}>
                      Cancel
                    </Button>
                  </div>
                )}

                {pendingTier && confirming && (
                  <div
                    role="alertdialog"
                    aria-label="Confirm tier change"
                    className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
                  >
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Change {selected.name} from {PLANS[selected.effectivePlan].name} to{" "}
                      {PLANS[pendingTier].name}?
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      This takes effect immediately: the new tier&apos;s features and limits
                      apply across the app. The change is written to the audit log with your
                      email.
                    </p>
                    {gained.length > 0 && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-medium">They gain:</span>{" "}
                        {gained.map((f) => f.label).join(", ")}.
                      </p>
                    )}
                    {warnings.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {warnings.map((w) => (
                          <li
                            key={w}
                            className="text-sm font-medium text-amber-800 dark:text-amber-200"
                          >
                            ⚠ {w}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button onClick={doConfirm} disabled={busy}>
                        {busy ? "Saving…" : `Yes, set ${PLANS[pendingTier].name}`}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setConfirming(false)}
                        disabled={busy}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit log */}
      <Card>
        <CardHeader>
          <CardTitle>Audit log ({entries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No tier changes recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="py-2 pr-4 font-medium">When</th>
                    <th className="py-2 pr-4 font-medium">Company</th>
                    <th className="py-2 pr-4 font-medium">Affected user</th>
                    <th className="py-2 pr-4 font-medium">Change</th>
                    <th className="py-2 font-medium">Changed by</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap py-2.5 pr-4 text-slate-500 dark:text-slate-400">
                        {formatDateTime(e.createdAt)}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-slate-100">
                        {e.companyName}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">
                        {e.affectedUserEmail}
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-4">
                        <Badge tone="slate">{planName(e.previousTier)}</Badge>
                        <span className="mx-1.5 text-slate-400">→</span>
                        <Badge tone={tierTones[e.newTier as PlanId] ?? "slate"}>
                          {planName(e.newTier)}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300">{e.adminEmail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Every tier change records who made it, whose company was affected, the
            previous and new tiers, and the exact time. Entries are append-only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
