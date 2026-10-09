import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tidy-pro.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TidyPro — Operations software for cleaning businesses",
    template: "%s | TidyPro",
  },
  description:
    "TidyPro helps residential and commercial cleaning businesses manage quotes, scheduling, teams, invoices, and customers in one simple place.",
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
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "TidyPro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TidyPro — Operations software for cleaning businesses",
    description:
      "Quotes, scheduling, teams, invoicing, and customers in one simple place for cleaning businesses.",
    images: ["/og-image.png"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
