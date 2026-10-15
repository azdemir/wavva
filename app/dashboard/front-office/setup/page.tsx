import type { Metadata } from "next";
import Link from "next/link";
import { getFrontOfficeSettings } from "@/lib/actions/front-office";
import { SetupWizard } from "@/components/dashboard/front-office/setup-wizard";

export const metadata: Metadata = {
  title: "Front Office setup",
};

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export default async function FrontOfficeSetupPage() {
  const initial = await getFrontOfficeSettings();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <Link href="/dashboard/front-office" className="hover:underline">
            Front Office
          </Link>{" "}
          / Setup
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Set up your front office
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Five short steps. Your price list becomes your AI assistant&apos;s
          only source for quotes, and anything outside it comes to you for
          approval.
        </p>
      </div>
      <SetupWizard initial={initial} />
    </div>
  );
}
