import type { Metadata } from "next";
import { requireCompany } from "@/lib/auth";
import { PLANS, isPlanId, type PlanId } from "@/lib/plans";
import { getTranslations } from "next-intl/server";
import { DashboardIntlProvider } from "@/components/i18n/dashboard-intl-provider";
import { SubscriptionBanner } from "@/components/billing/subscription-banner";
import { DashboardTopBar, type TopBarNavItem } from "@/components/dashboard/top-bar";
import {
  HomeIcon,
  UsersIcon,
  TagIcon,
  QuoteIcon,
  CalendarIcon,
  ClockIcon,
  CardIcon,
  GearIcon,
  BellIcon,
  ChartIcon,
  DownloadIcon,
} from "@/components/ui/icons";
import { hasFeature, type PlanFeature } from "@/lib/plans";
import { type Role } from "@/lib/permissions";

// Workspace routes render per request (auth session) — never prerendered.
export const instant = false;

// Private app surface: never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type NavItem = {
  href: string;
  /** Key into the "nav" messages namespace. */
  labelKey: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  soon?: boolean;
  /** If set, only shown to plans that include this feature. */
  feature?: PlanFeature;
  /** If set, only shown to these roles. Omitted = everyone. */
  roles?: Role[];
};

const STAFF: Role[] = ["owner", "manager"];

const nav: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: HomeIcon, roles: STAFF },
  { href: "/dashboard/customers", labelKey: "customers", icon: UsersIcon, roles: STAFF },
  { href: "/dashboard/services", labelKey: "services", icon: TagIcon, roles: STAFF },
  { href: "/dashboard/quotes", labelKey: "quotes", icon: QuoteIcon, roles: STAFF },
  { href: "/dashboard/bookings", labelKey: "bookings", icon: CalendarIcon, roles: STAFF },
  { href: "/dashboard/jobs", labelKey: "jobs", icon: ClockIcon, roles: STAFF },
  { href: "/dashboard/schedule", labelKey: "schedule", icon: CalendarIcon, feature: "schedule", roles: STAFF },
  { href: "/dashboard/my-jobs", labelKey: "myJobs", icon: ClockIcon },
  { href: "/dashboard/invoices", labelKey: "invoices", icon: CardIcon, roles: STAFF },
  { href: "/dashboard/reports", labelKey: "reports", icon: ChartIcon, feature: "reports", roles: ["owner"] },
  { href: "/dashboard/billing", labelKey: "billing", icon: CardIcon, roles: ["owner"] },
  { href: "/dashboard/team", labelKey: "team", icon: UsersIcon, roles: ["owner"] },
  { href: "/dashboard/settings", labelKey: "settings", icon: GearIcon, roles: ["owner"] },
  { href: "/dashboard/import", labelKey: "import", icon: DownloadIcon, roles: STAFF },
  { href: "/dashboard/audit", labelKey: "audit", icon: BellIcon, roles: ["owner"] },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, membership, company } = await requireCompany();
  const plan = isPlanId(company.plan) ? company.plan : "starter";
  const t = await getTranslations("nav");

  const items: TopBarNavItem[] = nav
    .filter(
      (item) =>
        (!item.feature || hasFeature(plan, item.feature)) &&
        (!item.roles || item.roles.includes(membership.role)),
    )
    .map((item) => {
      const Icon = item.icon;
      return {
        href: item.href,
        label: t(item.labelKey),
        icon: <Icon className="h-4 w-4 shrink-0" />,
        soon: item.soon,
      };
    });

  const roleLabel =
    membership.role === "owner"
      ? t("roleOwner")
      : membership.role === "manager"
        ? t("roleManager")
        : t("roleCleaner");

  return (
    <DashboardIntlProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <DashboardTopBar
          items={items}
          user={{
            companyName: company.name,
            email: user.email ?? "",
            roleLabel,
            planName: PLANS[plan as PlanId].name,
          }}
          labels={{
            account: t("userMenu.account"),
            signOut: t("signOut"),
            websiteHome: t("websiteHome"),
            backHomeLabel: t("backHomeLabel"),
            soon: t("soon"),
            comingSoon: t("comingSoon"),
            mainNav: t("userMenu.mainNav"),
            openMenu: t("userMenu.openMenu"),
          }}
        />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
            <SubscriptionBanner
              status={company.subscription_status ?? "none"}
              planName={PLANS[plan].name}
            />
            {children}
          </div>
        </main>
      </div>
    </DashboardIntlProvider>
  );
}
