import type { Metadata } from "next";

// Customer portal pages are token-gated and private: never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
