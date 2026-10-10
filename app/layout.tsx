import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { SessionTimeout } from "@/components/auth/session-timeout";
import {
  ThemeProvider,
  themeInitScript,
} from "@/components/ui/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* Editorial display face — headlines only. A high-contrast serif gives the
   marketing site an "expensive print" voice a geometric sans can't. */
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tidy-pro.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Cleaning Business Software — Scheduling, Quotes & Invoicing | TidyPro",
    template: "%s | TidyPro",
  },
  description:
    "TidyPro is cleaning business software for scheduling, quotes, crew management, invoicing, and payments. Built for Upstate NY cleaners. Flat pricing from $10/mo — no per-user fees. Start free for 14 days.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "TidyPro",
    title: "TidyPro — Operations software for cleaning businesses",
    description:
      "Quotes, scheduling, teams, invoicing, and customers in one simple place for cleaning businesses.",
    url: "/",
    images: [{ url: "/og-image.jpg", width: 1000, height: 525, alt: "TidyPro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TidyPro — Operations software for cleaning businesses",
    description:
      "Quotes, scheduling, teams, invoicing, and customers in one simple place for cleaning businesses.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "TidyPro",
      url: SITE_URL,
      description:
        "Operations software for residential and commercial cleaning businesses.",
      email: "hello@tidypro.app",
    },
    {
      "@type": "WebSite",
      name: "TidyPro",
      url: SITE_URL,
    },
    {
      "@type": "SoftwareApplication",
      name: "TidyPro",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description:
        "Quotes, scheduling, team management, invoicing, and customer portal for cleaning businesses.",
      offers: {
        "@type": "Offer",
        price: "49",
        priceCurrency: "USD",
        description: "Starter plan, billed monthly. 14-day free trial.",
      },
    },
  ],
};

export default function RootLayout(props: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <SessionTimeout />
          {props.children}
        </ThemeProvider>
      </body>
    </html>
  );
}
