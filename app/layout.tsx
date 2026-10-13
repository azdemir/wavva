import type { Metadata, Viewport } from "next";
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
      "We run your front office. You run the cleaning. | TidyPro",
    template: "%s | TidyPro",
  },
  description:
    "TidyPro's done-for-you Front Office Service: an AI assistant answers every call, text and email in your company's name, books your schedule, and follows up every unpaid invoice. From $300/mo, month to month. Self-serve software from $10/mo.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "TidyPro",
    title: "TidyPro — We run your front office. You run the cleaning.",
    description:
      "Every new enquiry answered quickly, every quote followed up, every visit confirmed and every unpaid invoice followed up, under your company's name.",
    url: "/",
    images: [{ url: "/og-image.jpg", width: 1000, height: 525, alt: "TidyPro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TidyPro — We run your front office. You run the cleaning.",
    description:
      "Every new enquiry answered quickly, every quote followed up, every visit confirmed and every unpaid invoice followed up, under your company's name.",
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
