import type { Metadata } from "next";
import { site } from "@/lib/site";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ContactForm } from "@/components/marketing/contact-form";
import { getContent } from "@/lib/studio/content";


export const metadata: Metadata = {
  title: "Contact",
  description: `Contact the ${site.name} team about plans, the pilot program, or whether TidyPro fits your cleaning business.`,
};

export default async function ContactPage() {
  const [
    heroEyebrow,
    heroTitle,
    heroDescription,
    pilotTitle,
    pilotBody,
    siteEmail,
  ] = await Promise.all([
    getContent<string>("contact.hero.eyebrow"),
    getContent<string>("contact.hero.title"),
    getContent<string>("contact.hero.description"),
    getContent<string>("contact.pilot.title"),
    getContent<string>("contact.pilot.body"),
    getContent<string>("site.email"),
  ]);
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          eyebrow={heroEyebrow}
          title={heroTitle}
          description={heroDescription}
        />

        <section className="bg-white py-16 sm:py-20 dark:bg-slate-950">
          <Container>
            <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <Card>
                  <CardContent>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Email us
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      The fastest way to reach a human.
                    </p>
                    <a
                      href={`mailto:${siteEmail}`}
                      className="mt-3 inline-block text-base font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400"
                    >
                      {siteEmail}
                    </a>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {pilotTitle}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {pilotBody}
                    </p>
                    <Button href="/demo" variant="outline" className="mt-4">
                      Start free trial
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Prefer to explore first?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      Browse the feature tour and pricing — most questions are
                      answered there.
                    </p>
                    <div className="mt-4 flex gap-3">
                      <Button href="/features" variant="outline" size="sm">
                        Features
                      </Button>
                      <Button href="/pricing" variant="outline" size="sm">
                        Pricing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                  <CardDescription>
                    Tell us about your business and what you&apos;re looking for.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactForm />
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
