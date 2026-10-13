import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon } from "@/components/ui/icons";
import { FoundingClientForm } from "@/components/marketing/founding-client-form";

export const metadata: Metadata = {
  title: "Claim a founding spot — Front Office Service",
  description:
    "Apply as a founding client of TidyPro's Front Office Service: free setup, founding price locked for 12 months, month to month. Five spots for Upstate New York cleaning companies.",
  alternates: { canonical: "/founding-client" },
};

const PERKS = [
  "Free setup, including moving your current customer list and schedule",
  "Founding price locked for 12 months",
  "Month to month — cancel any month",
  "Your number stays yours; everything goes out under your company's name",
];

export default function FoundingClientPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          eyebrow="Founding clients"
          title="Claim a founding spot"
          description="Five cleaning companies in Upstate New York. Free setup. Founding price locked for 12 months. Tell us about your business and we'll take it from there."
        />
        <section className="bg-white py-16 sm:py-20 dark:bg-slate-950">
          <Container>
            <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <SectionHeading
                  align="left"
                  eyebrow="What you get"
                  title="As a founding client"
                />
                <ul className="mt-8 space-y-4">
                  {PERKS.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700 dark:bg-accent-950 dark:text-accent-400">
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <Card>
                <CardContent>
                  <Suspense
                    fallback={
                      <p className="text-sm text-slate-500">Loading application form…</p>
                    }
                  >
                    <FoundingClientForm />
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
