import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Cta } from "@/components/marketing/cta";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { ArrowRightIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Compare TidyPro",
  description:
    "How TidyPro compares to other cleaning business software — honest, side-by-side comparisons on pricing, quote follow-up, and cleaning-specific features.",
  alternates: { canonical: "/compare" },
};

const COMPARISONS = [
  {
    href: "/compare/jobber",
    name: "Jobber",
    blurb:
      "Per-user pricing vs TidyPro's flat rate, quote follow-up, and cleaning-first design.",
  },
];

export default function CompareIndexPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          eyebrow="Comparisons"
          title="How TidyPro compares"
          description="Honest, side-by-side looks at how TidyPro stacks up against the big names in field-service software — on the things cleaning businesses actually care about."
          crumbs={[{ label: "Compare", href: "/compare" }]}
        />
        <section className="bg-white py-16 sm:py-20 dark:bg-slate-950">
          <Container>
            <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
              {COMPARISONS.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    TidyPro vs {c.name}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {c.blurb}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400">
                    Read the comparison
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
        <Cta />
      </main>
      <Footer />
    </>
  );
}
