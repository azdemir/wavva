import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
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

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tidy-pro.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Prevent iOS Safari auto-zoom on input focus (which feels janky/slow).
  // Inputs should use 16px+ font-size; this is a safety net.
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Every call answered. Every business. | Wavva",
    template: "%s | Wavva",
  },
  description:
    "Wavva is the AI front office for every business: every call answered in your business's name, appointments booked, quotes followed up, invoices collected. Flat $299/mo, month to month. Free 7-day trial.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Wavva",
    title: "Wavva — Every call answered. Every business.",
    description:
      "The AI front office for any business that takes calls. Every call answered in your business's name, every appointment booked, one flat monthly fee.",
    url: "/",
    // images come from app/opengraph-image.tsx (generated, always in sync)
  },
  twitter: {
    card: "summary_large_image",
    title: "Wavva — Every call answered. Every business.",
    description:
      "The AI front office for any business that takes calls. Every call answered in your business's name, every appointment booked, one flat monthly fee.",
    // images come from app/twitter-image.tsx (same generated artwork)
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
      name: "Wavva",
      url: SITE_URL,
      description:
        "AI-powered front office for every business: call answering, appointment booking, quoting, invoicing and collections.",
      email: "hello@wavva.example",
    },
    {
      "@type": "WebSite",
      name: "Wavva",
      url: SITE_URL,
    },
    {
      "@type": "Service",
      name: "Wavva AI Front Office",
      url: SITE_URL,
      description:
        "Done-for-you AI front office: answers every call in your business's name, books appointments, follows up quotes, collects invoices.",
      offers: {
        "@type": "Offer",
        price: "299",
        priceCurrency: "USD",
        description: "Essential plan, billed monthly. 7-day free trial.",
      },
    },
  ],
};

export default function RootLayout(props: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{props.children}</ThemeProvider>
      </body>
    </html>
  );
}
