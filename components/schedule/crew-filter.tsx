"use client";

import { useRouter, useSearchParams } from "next/navigation";

/** Crew-member filter for the week schedule. Updates the `crew` query param. */
export function CrewFilter({
  members,
}: {
  members: { user_id: string; email: string }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const current = sp.get("crew") ?? "all";

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-medium text-slate-600 dark:text-slate-300">Crew</span>
      <select
        value={current}
        onChange={(e) => {
          const next = new URLSearchParams(sp.toString());
          if (e.target.value === "all") next.delete("crew");
          else next.set("crew", e.target.value);
          const qs = next.toString();
          router.push(qs ? `/dashboard/schedule?${qs}` : "/dashboard/schedule");
        }}
        className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-700 focus:outline-2 focus:outline-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <option value="all">Everyone</option>
        {members.map((m) => (
          <option key={m.user_id} value={m.user_id}>
            {m.email}
          </option>
        ))}
      </select>
    </label>
  );
}
