import type { Metadata } from "next";
import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { SubscriptionBanner } from "@/components/billing/subscription-banner";
import { PLANS, isPlanId, type PlanId } from "@/lib/plans";
import { getTranslations } from "next-intl/server";
import { DashboardIntlProvider } from "@/components/i18n/dashboard-intl-provider";
import { DashboardUserBar, type UserBarNavItem } from "@/components/dashboard/top-bar";
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
  PlugIcon,
} from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/logo";
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
  { href: "/dashboard/availability", labelKey: "availability", icon: ClockIcon },
  { href: "/dashboard/my-jobs", labelKey: "myJobs", icon: ClockIcon },
  { href: "/dashboard/invoices", labelKey: "invoices", icon: CardIcon, roles: STAFF },
  { href: "/dashboard/reports", labelKey: "reports", icon: ChartIcon, feature: "reports", roles: ["owner"] },
  { href: "/dashboard/billing", labelKey: "billing", icon: CardIcon, roles: ["owner"] },
  { href: "/dashboard/team", labelKey: "team", icon: UsersIcon, roles: ["owner"] },
  { href: "/dashboard/settings", labelKey: "settings", icon: GearIcon, roles: ["owner"] },
  { href: "/dashboard/import", labelKey: "import", icon: DownloadIcon, roles: STAFF },
  { href: "/dashboard/integrations", labelKey: "integrations", icon: PlugIcon, feature: "integrations", roles: ["owner"] },
  { href: "/dashboard/audit", labelKey: "audit", icon: BellIcon, roles: ["owner"] },
];

async function NavLinks({ onNavigate, plan, role }: { onNavigate?: () => void; plan: PlanId; role: Role }) {
  const t = await getTranslations("nav");
  const visible = nav.filter(
    (item) =>
      (!item.feature || hasFeature(plan, item.feature)) &&
      (!item.roles || item.roles.includes(role)),
  );
  return (
    <nav className="space-y-1" aria-label="Workspace">
      {visible.map((item) => {
        const Icon = item.icon;
        const content = (
          <>
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1">{t(item.labelKey)}</span>
            {item.soon && (
              <Badge tone="slate" className="text-[10px]">
                {t("soon")}
              </Badge>
            )}
          </>
        );
        const cls =
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 hover:text-slate-900";
        return item.soon ? (
          <span
            key={item.href}
            className={`${cls} cursor-not-allowed opacity-60`}
            title={t("comingSoon")}
          >
            {content}
          </span>
        ) : (
          <Link key={item.href} href={item.href} className={cls} onClick={onNavigate}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, membership, company } = await requireCompany();
  const plan = isPlanId(company.plan) ? company.plan : "starter";
  const t = await getTranslations("nav");

  // Nav items for the mobile hamburger menu (desktop uses the sidebar).
  const items: UserBarNavItem[] = nav
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
    <div className="min-h-screen bg-slate-50 md:flex dark:bg-slate-950">
      {/* Desktop sidebar: primary navigation */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-full flex-col">
          <Link href="/dashboard" className="flex items-center gap-2.5 px-5 pb-5 pt-6">
            <LogoMark className="h-9 w-9" />
          </Link>
          <div className="flex-1 overflow-y-auto px-3">
            <NavLinks plan={plan} role={membership.role} />
          </div>
        </div>
      </aside>

      {/* Content column with slim user bar on top */}
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardUserBar
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
    </div>
    </DashboardIntlProvider>
  );
}
