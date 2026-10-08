import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const { company } = await requireOwner();

  return (
    <div className="max-w-3xl space-y-8">
      <Heading
        title="Settings"
        description="Your company profile, pricing defaults, and policies."
      />
      <Link href="/dashboard/settings/billing" className="block">
        <Card className="transition hover:border-brand-300 hover:shadow-sm">
          <CardContent className="flex items-center justify-between py-5">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Billing & plan</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                Your TidyPro subscription, team seats, and invoices from us.
              </p>
            </div>
            <span className="text-sm font-semibold text-brand-700 dark:text-brand-400">Manage →</span>
          </CardContent>
        </Card>
      </Link>
      <Card>
        <CardContent className="pt-6">
          <SettingsForm company={company} />
        </CardContent>
      </Card>
    </div>
  );
}
