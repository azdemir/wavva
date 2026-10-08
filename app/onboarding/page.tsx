import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const instant = false;
import { headers } from "next/headers";
import { site } from "@/lib/site";
import { requireUser, getActiveMembership } from "@/lib/auth";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SparkleIcon } from "@/components/ui/icons";
import { OnboardingProgress } from "@/components/onboarding/progress";
import { CompanyStep } from "@/components/onboarding/company-step";
import { ServicesStep } from "@/components/onboarding/services-step";
import { AreasStep } from "@/components/onboarding/areas-step";
import { TeamStep } from "@/components/onboarding/team-step";

export const metadata: Metadata = {
  title: "Set up your business",
  description: "Set up your cleaning business workspace in a few steps.",
};

const stepMeta = [
  { title: "Your business", description: "Tell us about your cleaning company." },
  { title: "Your services", description: "What do you clean, and what do you charge?" },
  { title: "Your service area", description: "Where do your crews work?" },
  { title: "Your team", description: "Invite the people who'll use TidyPro with you." },
];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  await requireUser();
  const active = await getActiveMembership();
  if (active?.company.onboarding_completed) redirect("/dashboard");

  const rawStep = parseInt((await searchParams).step ?? "1", 10);
  const step = Number.isFinite(rawStep) ? Math.min(Math.max(rawStep, 1), 4) : 1;

  // Can't skip ahead before the company exists.
  if (!active && step > 1) redirect("/onboarding?step=1");

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${proto}://${h.get("host")}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <Container>
        <div className="mx-auto max-w-2xl py-10">
          <div className="mb-8 flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <SparkleIcon className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              {site.name}
            </span>
          </div>

          <OnboardingProgress current={step} />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>{stepMeta[step - 1].title}</CardTitle>
              <CardDescription>{stepMeta[step - 1].description}</CardDescription>
            </CardHeader>
            <CardContent>
              {step === 1 && <CompanyStep company={active?.company ?? null} />}
              {step === 2 && <ServicesStep />}
              {step === 3 && <AreasStep />}
              {step === 4 && <TeamStep baseUrl={baseUrl} />}
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
