"use client";

import { useMemo, useState } from "react";
import {
  studioUpdateUserRole,
  studioUpdateUserEmail,
  studioDeleteUser,
} from "@/lib/studio/actions";
import type { StudioUser } from "@/lib/studio/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";

const roleTones = { owner: "brand", manager: "accent", cleaner: "slate" } as const;

function formatJoined(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Platform-admin user management: edit email/role, delete users. */
export function UsersManager({ users }: { users: StudioUser[] }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StudioUser["role"]>("cleaner");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.companyName.toLowerCase().includes(q),
    );
  }, [users, query]);

  function startEdit(u: StudioUser) {
    setEditing(u.membershipId);
    setEmail(u.email);
    setRole(u.role);
    setConfirming(null);
    setError(null);
  }

  async function saveEdit(u: StudioUser) {
    setBusy(true);
    setError(null);
    try {
      if (email.trim().toLowerCase() !== u.email.toLowerCase()) {
        const r = await studioUpdateUserEmail(u.userId, email.trim());
        if (!r.ok) throw new Error(r.error ?? "Couldn't update the email.");
      }
      if (role !== u.role) {
        const r = await studioUpdateUserRole(u.membershipId, role);
        if (!r.ok) throw new Error(r.error ?? "Couldn't update the role.");
      }
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save changes.");
    } finally {
      setBusy(false);
    }
  }

  async function doDelete(u: StudioUser) {
    setBusy(true);
    setError(null);
    try {
      const r = await studioDeleteUser(u.userId);
      if (!r.ok) throw new Error(r.error ?? "Couldn't delete the user.");
      setConfirming(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete the user.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            Users ({filtered.length}
            {query ? ` of ${users.length}` : ""})
          </CardTitle>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email or company…"
            aria-label="Search users"
            className="h-10 w-64 max-w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
          >
            {error}
          </p>
        )}
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {users.length === 0 ? "No users yet." : "No users match your search."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((u) => {
              const isEditing = editing === u.membershipId;
              const isConfirming = confirming === u.userId;
              return (
                <li key={u.membershipId} className="py-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          id={`email-${u.membershipId}`}
                          label="Email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={busy}
                        />
                        <div>
                          <label
                            htmlFor={`role-${u.membershipId}`}
                            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
                          >
                            Role
                          </label>
                          <select
                            id={`role-${u.membershipId}`}
                            value={role}
                            onChange={(e) =>
                              setRole(e.target.value as StudioUser["role"])
                            }
                            disabled={busy}
                            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          >
                            <option value="owner">Owner</option>
                            <option value="manager">Manager</option>
                            <option value="cleaner">Cleaner</option>
                          </select>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Changing the email updates their login too. They may need
                        to confirm the new address.
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={() => saveEdit(u)} disabled={busy}>
                          {busy ? "Saving…" : "Save changes"}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setEditing(null)}
                          disabled={busy}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                          {u.email}
                        </p>
                        <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                          {u.companyName} · Joined {formatJoined(u.createdAt)}
                        </p>
                      </div>
                      <Badge tone={roleTones[u.role] ?? "slate"} className="shrink-0">
                        {u.role}
                      </Badge>
                      {isConfirming ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-red-700 dark:text-red-300">
                            Delete this user?
                          </span>
                          <Button
                            variant="danger"
                            onClick={() => doDelete(u)}
                            disabled={busy}
                          >
                            {busy ? "Deleting…" : "Yes, delete"}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setConfirming(null)}
                            disabled={busy}
                          >
                            Keep
                          </Button>
                        </div>
                      ) : (
                        <div className="flex shrink-0 gap-2">
                          <Button variant="outline" onClick={() => startEdit(u)}>
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => {
                              setConfirming(u.userId);
                              setEditing(null);
                              setError(null);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Deleting removes the user&apos;s logins and all their company
          memberships. You can&apos;t delete your own account.
        </p>
      </CardContent>
    </Card>
  );
}
