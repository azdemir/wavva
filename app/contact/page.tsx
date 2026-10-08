import type { Metadata } from "next";
import { site } from "@/lib/site";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, TextareaField } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact the ${site.name} team about plans, the pilot program, or whether TidyPro fits your cleaning business.`,
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          eyebrow="Contact"
          title="Talk to us"
          description="Questions about plans, the pilot program, or whether TidyPro fits your business — we reply within one business day."
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
                      href={`mailto:${site.email}`}
                      className="mt-3 inline-block text-base font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400"
                    >
                      {site.email}
                    </a>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Join the pilot program
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      We&apos;re onboarding a small group of cleaning businesses
                      now and building the roadmap around their feedback. Pilot
                      members get extra onboarding help and a voice in what we
                      build next.
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
                <CardContent className="space-y-4">
                  <div
                    role="note"
                    className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
                  >
                    Preview only — this form isn&apos;t collecting messages yet.
                    Email{" "}
                    <a
                      href={`mailto:${site.email}`}
                      className="font-semibold underline"
                    >
                      {site.email}
                    </a>{" "}
                    to reach us directly.
                  </div>
                  {/* No form element: the submit is disabled (preview only),
                      and server components can't carry event handlers. */}
                  <div className="space-y-4">
                    <Field
                      id="contact-name"
                      label="Your name"
                      type="text"
                      autoComplete="name"
                      placeholder="Jordan Smith"
                      required
                    />
                    <Field
                      id="contact-company"
                      label="Company name"
                      type="text"
                      autoComplete="organization"
                      placeholder="Capital Region Clean Co."
                    />
                    <Field
                      id="contact-email"
                      label="Email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      required
                    />
                    <TextareaField
                      id="contact-message"
                      label="Message"
                      placeholder="We run a 4-person residential cleaning crew in Albany and…"
                      required
                    />
                    <Button type="submit" className="w-full" disabled>
                      Send message
                    </Button>
                  </div>
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
