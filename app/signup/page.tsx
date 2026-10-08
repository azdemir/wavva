import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const instant = false;
import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthSetupNotice } from "@/components/auth/setup-notice";
import { signUp } from "@/lib/actions/auth";
import { getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your TidyPro account and set up your cleaning business.",
};

export default async function SignUpPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <AuthCard
      title="Create your account"
      description="Start your free 14-day trial. No credit card required."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            Sign in
          </Link>
        </>
      }
    >
      {isSupabaseConfigured() ? (
        <>
          <AuthForm
            action={signUp}
            submitLabel="Create account"
            pendingLabel="Creating account…"
          />
          <p className="mt-4 text-xs text-slate-500">
            By creating an account you agree to set up one workspace per
            cleaning business. Each company&apos;s data stays private to that
            company.
          </p>
        </>
      ) : (
        <AuthSetupNotice />
      )}
    </AuthCard>
  );
}
