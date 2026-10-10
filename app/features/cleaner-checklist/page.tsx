import type { Metadata } from "next";
import { FeaturePage, type FeaturePageConfig } from "@/components/marketing/feature-page";
import {
  CameraIcon,
  CheckIcon,
  ClockIcon,
  UsersIcon,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Cleaning Checklist Templates for Your Team — TidyPro",
  description:
    "TidyPro checklist templates: define reusable cleaning checklists once, attach them to bookings, and every visit is seeded automatically. Consistent quality on every job.",
  alternates: { canonical: "/features/cleaner-checklist" },
};

const config: FeaturePageConfig = {
  slug: "cleaner-checklist",
  heroEyebrow: "Features",
  heroTitle: "Checklist Templates",
  heroDescription:
    "Reusable checklist templates seed every visit automatically — so quality doesn't depend on who's holding the mop.",
  introEyebrow: "Why it matters",
  introTitle: "Every clean, done your way",
  introBody:
    "Your reputation is built one clean at a time — and lost just as fast. When every cleaner follows the same checklist, customers get the same great result whether it's your best tech or their first week. TidyPro bakes your standards into every job.",
  benefits: [
    {
      icon: CheckIcon,
      title: "Define it once, use it forever",
      body: "Build checklist templates per service — deep clean, move-out, office — and attach one to any booking. Every generated visit is seeded automatically.",
    },
    {
      icon: ClockIcon,
      title: "Checklists in the field",
      body: "Cleaners open My Jobs on their phone and work through the list: start the job, check items off, and complete it — with a live in-progress timer.",
    },
    {
      icon: CameraIcon,
      title: "Proof of a job well done",
      body: "Pair checklists with before-and-after photos on Pro plans, and you have a complete record of every clean — great for quality reviews and disputes.",
    },
  ],
  blocks: [
    {
      icon: CheckIcon,
      kicker: "Templates",
      title: "Your standards, on paper (digitally)",
      body: "Owners define reusable templates in Settings — one for each service you offer. Attach a template when creating a booking and every visit it generates carries your checklist.",
      bullets: [
        "Reusable templates per service, managed in one place",
        "Attach at booking time; every generated visit is seeded",
        "Editing or deleting a template never touches already-seeded visits",
      ],
    },
    {
      icon: UsersIcon,
      kicker: "Field",
      title: "Simple enough for day one",
      body: "New hires don't need training on your process — the checklist is the training. Open the job, start the timer, and work down the list. Nothing gets skipped, nothing gets forgotten.",
      bullets: [
        "Mobile-friendly My Jobs view for every cleaner",
        "Start/complete with a live 'in progress' status badge",
        "Completed checklists visible on the job page for review",
      ],
    },
    {
      icon: CameraIcon,
      kicker: "Proof",
      title: "Accountability without micromanaging",
      body: "You can't be at every clean — but you can see every clean. Completed checklists and before/after photos give you a window into the work without hovering.",
      bullets: [
        "Before-and-after photo uploads on Pro plans",
        "Spot missed items and coach with specifics",
        "A documented record that protects you in disputes",
      ],
    },
  ],
  faqs: [
    {
      q: "Which plans include checklist templates?",
      a: "Reusable checklist templates are a Growth feature and above. Starter plans still get per-job completion tracking through the job lifecycle.",
    },
    {
      q: "Can different services have different checklists?",
      a: "Yes — that's the point. Create a template for each service (deep clean, move-out, recurring maintenance), and attach the right one when you create the booking.",
    },
    {
      q: "What happens if I change a template after visits are created?",
      a: "Nothing breaks. Visits are seeded with a copy of the template at creation time, so editing or deleting a template only affects future bookings — existing visits keep their checklists.",
    },
    {
      q: "Do cleaners need the mobile app for checklists?",
      a: "No. Checklists work today in the mobile-friendly My Jobs view in any phone browser. A dedicated native app with offline support is on the roadmap.",
    },
  ],
};

export default function CleanerChecklistPage() {
  return <FeaturePage config={config} />;
}
