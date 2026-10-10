"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SelectField } from "@/components/ui/input";
import { AvailabilityEditor } from "@/components/availability/availability-editor";
import { TimeOffForm } from "@/components/availability/time-off-form";
import {
  getAvailability,
  type RosterMember,
  type AvailabilityWindowInput,
} from "@/lib/actions/availability";

/**
 * Staff view: pick a team member, edit their weekly availability, and log
 * time off for them. Windows are fetched when the selection changes.
 */
export function StaffAvailabilityView({
  members,
  initialWindows,
}: {
  members: RosterMember[];
  initialWindows: AvailabilityWindowInput[];
}) {
  const t = useTranslations("availability");
  const [selectedId, setSelectedId] = useState(members[0]?.id ?? "");
  const [windows, setWindows] = useState<AvailabilityWindowInput[]>(initialWindows);
  const [loading, setLoading] = useState(false);

  const selected = members.find((m) => m.id === selectedId);

  async function changeMember(id: string) {
    setSelectedId(id);
    setLoading(true);
    const { windows: fresh } = await getAvailability(id);
    setWindows(fresh);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <SelectField
        id="avail-member"
        label={t("selectMember")}
        value={selectedId}
        onChange={(e) => changeMember(e.target.value)}
      >
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.email} · {m.role}
          </option>
        ))}
      </SelectField>

      {selected ? (
        <>
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("saveAvailability")}…
            </p>
          ) : (
            <AvailabilityEditor
              key={selected.id}
              membershipId={selected.id}
              initial={windows}
              title={t("memberAvailability", { email: selected.email })}
            />
          )}
          <TimeOffForm mode="log" membershipId={selected.id} />
        </>
      ) : null}
    </div>
  );
}
