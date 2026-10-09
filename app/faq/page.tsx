import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Cta } from "@/components/marketing/cta";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { getContent } from "@/lib/studio/content";


export const metadata: Metadata = {
  title: "Cleaning Business Software FAQ",
  description:
    "TidyPro FAQ: how the 14-day trial works, flat pricing with no per-user fees, migrating from Jobber or spreadsheets, data privacy, and what happens after you cancel.",
  alternates: { canonical: "/faq" },
};

type FaqEntry = { group: string; q: string; a: string };

export default async function FaqPage() {
  const [eyebrow, title, description, entries] = await Promise.all([
    getContent<string>("faq.hero.eyebrow"),
    getContent<string>("faq.hero.title"),
    getContent<string>("faq.hero.description"),
    getContent<FaqEntry[]>("faq.groups"),
  ]);
  // Group flat entries under their headings, preserving order.
  const grouped = new Map<string, FaqEntry[]>();
  for (const e of entries) {
    const list = grouped.get(e.group) ?? [];
    list.push(e);
    grouped.set(e.group, list);
  }
  const groups = [...grouped.entries()].map(([gtitle, items]) => ({ title: gtitle, items }));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.q,
      acceptedAnswer: { "@type": "Answer", text: e.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />
      <main>
        <PageHero
          eyebrow={eyebrow}
          title={title}
          description={description}
          crumbs={[{ label: "FAQ", href: "/faq" }]}
        />

        <section className="bg-white py-16 sm:py-20 dark:bg-slate-950">
          <Container>
            <div className="mx-auto max-w-3xl space-y-12">
              {groups.map((g) => (
                <div key={g.title}>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {g.title}
                  </h2>
                  <div className="mt-5 space-y-4">
                    {g.items.map((f) => (
                      <details
                        key={f.q}
                        className="group rounded-xl border border-slate-200 bg-white px-6 py-4 open:shadow-sm dark:border-slate-800 dark:bg-slate-900"
                      >
                        <summary className="cursor-pointer list-none text-base font-semibold text-slate-900 dark:text-slate-100 [&::-webkit-details-marker]:hidden">
                          <span className="flex items-center justify-between gap-4">
                            {f.q}
                            <span
                              aria-hidden="true"
                              className="text-xl font-normal text-brand-600 dark:text-brand-400 transition-transform group-open:rotate-45"
                            >
                              +
                            </span>
                          </span>
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                          {f.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
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
