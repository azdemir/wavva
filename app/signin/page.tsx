import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const instant = false;
import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthSetupNotice } from "@/components/auth/setup-notice";
import { signIn } from "@/lib/actions/auth";
import { getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your TidyPro workspace.",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  // Already signed in? Skip the form.
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  const { next, reason } = await searchParams;

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your cleaning business workspace."
      footer={
        <>
          New to TidyPro?{" "}
          <Link
            href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
            className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400"
          >
            Create an account
          </Link>
        </>
      }
    >
      {reason === "inactivity" && (
        <p role="status" className="mb-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          You were signed out after 15 minutes of inactivity. Sign in to continue.
        </p>
      )}
      {isSupabaseConfigured() ? (
        <AuthForm
          action={signIn}
          submitLabel="Sign in"
          pendingLabel="Signing in…"
          nextPath={next}
        />
      ) : (
        <AuthSetupNotice />
      )}
    </AuthCard>
  );
}
