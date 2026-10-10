import type { Metadata } from "next";
import { FeaturePage, type FeaturePageConfig } from "@/components/marketing/feature-page";
import {
  BellIcon,
  CameraIcon,
  CheckIcon,
  ClockIcon,
  PhoneIcon,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "TidyPro Mobile App for Cleaners — Coming Soon",
  description:
    "The TidyPro mobile app is coming soon: cleaners' schedules, checklists, time tracking, and job photos in one native app for iOS and Android.",
  alternates: { canonical: "/features/mobile-app" },
};

const config: FeaturePageConfig = {
  slug: "mobile-app",
  heroEyebrow: "Features",
  heroTitle: "Mobile App",
  heroDescription:
    "Your cleaners' whole day in their pocket — schedules, checklists, time tracking, and job notes, anywhere. Launching soon for iOS and Android.",
  heroBadge: "Coming soon",
  introEyebrow: "On the roadmap",
  introTitle: "Built for cleaners, not desks",
  introBody:
    "Cleaners don't work at computers — they work in homes, with their hands full and their phone in their pocket. The TidyPro mobile app is being designed around that reality: big touch targets, everything offline-capable, and nothing more than two taps away. Today, the mobile-friendly My Jobs view already covers the essentials in any phone browser.",
  benefits: [
    {
      icon: ClockIcon,
      title: "Today's jobs, at a glance",
      body: "Open the app to see the day's visits with addresses, times, and access instructions — plus push notifications when a new job is assigned.",
    },
    {
      icon: CheckIcon,
      title: "Checklists and time tracking",
      body: "Start a job with one tap, work through the checklist, and complete it. Time on site is tracked automatically for payroll and costing.",
    },
    {
      icon: CameraIcon,
      title: "Photos and notes from the field",
      body: "Snap before-and-after photos and add job notes right from the visit — they sync to the job record for you and the customer.",
    },
  ],
  blocks: [
    {
      icon: PhoneIcon,
      kicker: "Native",
      title: "A real app, not a stretched website",
      body: "Native iOS and Android apps with offline support, so a dead zone in a basement or a rural route never stops the workday. Everything syncs when the connection returns.",
      bullets: [
        "Native iOS and Android apps",
        "Offline-capable: jobs, checklists, and photos keep working",
        "Push notifications for new assignments and schedule changes",
      ],
    },
    {
      icon: BellIcon,
      kicker: "Connected",
      title: "The office sees everything live",
      body: "Job started, checklist progressing, photos uploaded, job completed — the dashboard reflects field activity in real time, so dispatchers always know the state of the day.",
      bullets: [
        "Live job status: scheduled → in progress → completed",
        "Photos and notes appear on the job record instantly",
        "Time tracking feeds payroll and job costing",
      ],
    },
    {
      icon: CheckIcon,
      kicker: "Today",
      title: "You don't have to wait",
      body: "The mobile-friendly My Jobs view already gives cleaners their schedule, checklists, and job details on any phone — no download needed. The native app builds on that foundation.",
      bullets: [
        "My Jobs works in any phone browser today",
        "Same checklists and job details as the future app",
        "Start your trial now and get notified at launch",
      ],
    },
  ],
  faqs: [
    {
      q: "When does the mobile app launch?",
      a: "The native iOS and Android apps are in active development. Start a free trial today and we'll notify you the moment they're available — your data and team carry over automatically.",
    },
    {
      q: "What can cleaners do on their phones today?",
      a: "The mobile-friendly My Jobs view already covers the essentials: upcoming visits with addresses and instructions, job checklists, start/complete with live status, and before/after photo uploads on Pro plans.",
    },
    {
      q: "Will the app work without cell service?",
      a: "Yes — offline support is a core requirement. Jobs, checklists, and photos will keep working in dead zones and sync automatically when the connection returns.",
    },
    {
      q: "Is there an extra cost for the mobile app?",
      a: "No. The mobile app is included with your TidyPro plan — your whole team uses it at no additional per-user cost, consistent with our flat pricing.",
    },
  ],
};

export default function MobileAppPage() {
  return <FeaturePage config={config} />;
}
