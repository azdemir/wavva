import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { TrialForm } from "@/components/marketing/trial-form";
import { getContent } from "@/lib/studio/content";

export const metadata: Metadata = {
  title: "Start your free trial",
  description:
    "Start a free 14-day trial of TidyPro — quotes, scheduling, teams, and invoicing for your cleaning business. No credit card required.",
  alternates: { canonical: "/demo" },
};

/**
 * Trial-request page. Submissions land in the Studio CRM as leads
 * (source=trial) and notify the owner — no more "preview only".
 */
export default async function DemoPage() {
  const [title, description, siteName] = await Promise.all([
    getContent<string>("demo.title"),
    getContent<string>("demo.description"),
    getContent<string>("site.name"),
  ]);

  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      <Container>
        <div className="flex min-h-screen flex-col items-center justify-center py-16">
          <Link href="/" className="mb-8 flex items-center gap-2.5">
            <Logo wordmark={siteName} />
          </Link>

          {/* SEO: the card title is not an h1, so expose one for crawlers */}
          <h1 className="sr-only">{title}</h1>

          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TrialForm />
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400"
                >
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
