import { DashboardIntlProvider } from "@/components/i18n/dashboard-intl-provider";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardIntlProvider>{children}</DashboardIntlProvider>;
}
