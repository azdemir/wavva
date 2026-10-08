import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = {
  title: "Start your free trial",
  description: `Start a free 14-day trial of ${site.name}.`,
};

/**
 * UI preview only — this form does not collect submissions yet.
 * Demo request handling ships in a later stage.
 */
export default function DemoPage() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      <Container>
        <div className="flex min-h-screen flex-col items-center justify-center py-16">
          <Link href="/" className="mb-8 flex items-center gap-2.5">
<Logo />
          </Link>

          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Start your free 14-day trial</CardTitle>
              <CardDescription>
                Tell us about your cleaning business and we&apos;ll get you set
                up. No credit card required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                role="note"
                className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
              >
                Preview only — trial sign-ups aren&apos;t being collected yet.
                Email{" "}
                <a
                  href={`mailto:${site.email}`}
                  className="font-semibold underline"
                >
                  {site.email}
                </a>{" "}
                and we&apos;ll set you up directly.
              </div>
              {/* No onSubmit handler: the submit button is disabled (preview only),
                  so this form never submits. Server components can't carry
                  event handlers. */}
              <form>
                <div className="space-y-4">
                  <Field
                    id="demo-name"
                    label="Your name"
                    type="text"
                    autoComplete="name"
                    placeholder="Jordan Smith"
                    required
                  />
                  <Field
                    id="demo-company"
                    label="Company name"
                    type="text"
                    autoComplete="organization"
                    placeholder="Capital Region Clean Co."
                    required
                  />
                  <Field
                    id="demo-email"
                    label="Work email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    required
                  />
                  <Field
                    id="demo-phone"
                    label="Phone (optional)"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(518) 555-0100"
                  />
                  <Button type="submit" className="w-full" disabled>
                    Request my trial
                  </Button>
                </div>
              </form>
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
