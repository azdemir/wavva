import { requirePlatformAdmin } from "@/lib/admin";
import { listStudioCompanies, listTierChangeLog } from "@/lib/studio/tiers";
import { Heading } from "@/components/ui/heading";
import { TierManager } from "@/components/studio/tier-manager";

export const instant = false;

export const metadata = {
  title: "Subscription tiers",
  description:
    "TidyPro Studio — change any company's subscription tier and review the audit log.",
};

/**
 * Platform-admin subscription-tier management. Search companies (by name or
 * member email), change their tier with confirmation, and review every
 * change in the audit log. Permission is enforced in the server actions,
 * not just here.
 */
export default async function StudioTiersPage() {
  await requirePlatformAdmin();
  let companies: Awaited<ReturnType<typeof listStudioCompanies>> = [];
  let log: Awaited<ReturnType<typeof listTierChangeLog>> = [];
  try {
    [companies, log] = await Promise.all([
      listStudioCompanies(),
      listTierChangeLog(),
    ]);
  } catch {
    companies = [];
    log = [];
  }
  return (
    <div className="space-y-6">
      <Heading
        title="Subscription tiers"
        description="Change any company's plan — upgrades, downgrades, including your own. Every change is confirmed first and written to the audit log."
      />
      <TierManager companies={companies} log={log} />
    </div>
  );
}
