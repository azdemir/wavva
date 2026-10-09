import { redirect } from "next/navigation";
import { requireCompany, type Membership, type Company } from "@/lib/auth";

export type Role = Membership["role"];

export type Permission =
  | "customers.manage"
  | "services.manage"
  | "quotes.manage"
  | "bookings.manage"
  | "jobs.manage" // all jobs, crew assignment, canceling
  | "invoices.manage"
  | "schedule.view"
  | "portal.share" // portal links + portal emails
  | "exports.run" // Excel exports
  | "reports.view"
  | "team.manage"
  | "settings.manage"
  | "billing.manage"
  | "audit.view";

/**
 * Role model:
 * - owner: everything.
 * - manager: everything operational, except business config (team,
 *   settings, billing), audit log, and reports.
 * - cleaner: none of the coarse permissions — cleaners work through
 *   job-scoped checks (assigned jobs only) instead.
 */
const MANAGER_DENIED: Permission[] = [
  "team.manage",
  "settings.manage",
  "billing.manage",
  "audit.view",
  "reports.view",
];

export function can(role: Role, permission: Permission): boolean {
  if (role === "owner") return true;
  if (role === "manager") return !MANAGER_DENIED.includes(permission);
  return false;
}

/** Owners and managers. */
export function isStaff(role: Role): boolean {
  return role === "owner" || role === "manager";
}

/**
 * Staff can work any job; cleaners only jobs assigned to them.
 * Pure helper (not a server action) — lives here so "use server" modules
 * can share it without violating the async-export rule.
 */
export function canWorkJob(
  ctx: { membership: Membership; company: Company },
  job: { assigned_user_ids: string[] | null } | null,
): boolean {
  if (isStaff(ctx.membership.role)) return true;
  if (!job) return false;
  return (job.assigned_user_ids ?? []).includes(ctx.membership.user_id);
}

export const NOT_PERMITTED = "You don't have permission to do that.";

/**
 * Page guard: loads the company context, redirecting away when the member
 * lacks the permission. Cleaners land on My jobs, everyone else on Dashboard.
 */
export async function requirePermission(permission: Permission) {
  const ctx = await requireCompany();
  if (!can(ctx.membership.role, permission)) {
    redirect(ctx.membership.role === "cleaner" ? "/dashboard/my-jobs" : "/dashboard");
  }
  return ctx;
}

/**
 * Action guard: one-liner after `const ctx = await requireCompany()`:
 *   if (!isStaff(ctx.membership.role)) return { error: NOT_PERMITTED };
 */
