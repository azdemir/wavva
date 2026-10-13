import { Navbar } from "@/components/marketing/navbar";
import { FrontOfficeHero } from "@/components/marketing/front-office-hero";
import { ProofStrip } from "@/components/marketing/proof-strip";
import {
  TakeOffYourPlate,
  FrontOfficeHowItWorks,
  FrontOfficeTrust,
  FrontOfficePricing,
  FoundingStories,
  FoundingClient,
} from "@/components/marketing/front-office-sections";
import { Features } from "@/components/marketing/features";
import { CompareBand } from "@/components/marketing/compare-band";
import { Faq } from "@/components/marketing/faq";
import { Cta } from "@/components/marketing/cta";
import { Footer } from "@/components/marketing/footer";

/**
 * Homepage leads with the Front Office Service; the software is the engine
 * behind it.
 */
export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="top">
        <FrontOfficeHero />
        <ProofStrip />
        <TakeOffYourPlate />
        <FrontOfficeHowItWorks />
        <FrontOfficeTrust />
        <Features titleOverride="The software behind your front office" />
        <CompareBand />
        <FrontOfficePricing />
        <FoundingStories />
        <Faq />
        <FoundingClient />
        <Cta />
      </main>
      <Footer />
    </>
  );
}