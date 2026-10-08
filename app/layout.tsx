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

export const metadata: Metadata = {
  title: {
    default: "TidyPro — Operations software for cleaning businesses",
    template: "%s | TidyPro",
  },
  description:
    "TidyPro helps residential and commercial cleaning businesses manage quotes, scheduling, teams, invoices, and customers in one simple place.",
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
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{props.children}</ThemeProvider>
      </body>
    </html>
  );
}
