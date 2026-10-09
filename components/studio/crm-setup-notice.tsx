import { crmTablesReady, CRM_SETUP_HINT } from "@/lib/studio/crm-server";

/**
 * Amber setup notice shown on CRM pages when migration 0009 hasn't been run.
 * Renders nothing once the tables exist.
 */
export async function CrmSetupNotice() {
  let ready = true;
  try {
    ready = await crmTablesReady();
  } catch {
    ready = false;
  }
  if (ready) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <p className="font-semibold">CRM database not set up yet</p>
      <p className="mt-1">{CRM_SETUP_HINT}</p>
    </div>
  );
}
