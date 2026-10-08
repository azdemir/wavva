import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SparkleIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${site.name}.`,
};

/**
 * Placeholder — authentication ships in Stage 3.
 * This page exists so marketing CTAs never hit a dead link.
 */
export default function SignInPage() {
  return (
    <div className="bg-slate-50">
      <Container>
        <div className="flex min-h-screen flex-col items-center justify-center py-16">
          <Link href="/" className="mb-8 flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <SparkleIcon className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              {site.name}
            </span>
          </Link>

          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>
                Accounts and authentication ship in Stage 3 of the build.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                role="note"
                className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800"
              >
                This is a placeholder page — there are no real accounts yet, so
                nothing here is functional.
              </div>
              <Button href="/" variant="outline" className="mt-6 w-full">
                Back to home
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
