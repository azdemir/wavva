import type { Metadata } from "next";
import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";
import { Badge } from "@/components/ui/badge";
import { SubscriptionBanner } from "@/components/billing/subscription-banner";
import { PLANS, isPlanId, type PlanId } from "@/lib/plans";
import { getTranslations } from "next-intl/server";
import { DashboardIntlProvider } from "@/components/i18n/dashboard-intl-provider";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";

// Workspace routes render per request (auth session) — never prerendered.
export const instant = false;

// Private app surface: never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
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
} from "@/components/ui/icons";
import { Logo, LogoMark } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { hasFeature, type PlanFeature } from "@/lib/plans";
import { type Role } from "@/lib/permissions";

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
      <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          onClick={onNavigate}
          aria-label={t("backHomeLabel")}
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 3 3 10h3v7h4v-5h4v5h4v-7h3L10 3z" />
          </svg>
          <span className="flex-1">{t("websiteHome")}</span>
        </Link>
      </div>
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

  return (
    <DashboardIntlProvider>
    <div className="min-h-screen bg-slate-50 md:flex dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-full flex-col">
          <Link href="/dashboard" className="flex items-center gap-2.5 px-5 pb-5 pt-6">
<LogoMark className="h-9 w-9" />
          </Link>
          <div className="flex-1 overflow-y-auto px-3">
            <NavLinks plan={plan} role={membership.role} />
          </div>
          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <p className="truncate text-sm font-semibold text-slate-900">
              {company.name}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user.email} ·{" "}
              {membership.role === "owner"
                ? t("roleOwner")
                : membership.role === "manager"
                  ? t("roleManager")
                  : t("roleCleaner")}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm font-medium text-slate-500 hover:text-slate-800"
                >
                  {t("signOut")}
                </button>
              </form>
              <div className="flex items-center gap-2">
                <LocaleSwitcher />
                <ThemeToggle className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="no-print border-b border-slate-200 bg-white md:hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
<Logo />
          </Link>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle className="h-8 w-8" />
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                {t("signOut")}
              </button>
            </form>
          </div>
        </div>
        <div className="overflow-x-auto px-4 pb-3">
          <div className="flex gap-1">
            <Link
              href="/"
              aria-label={t("backHomeLabel")}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              ⌂ {t("backHome")}
            </Link>
            {nav
              .filter((n) => !n.soon && (!n.feature || hasFeature(plan, n.feature)) && (!n.roles || n.roles.includes(membership.role)))
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  {t(item.labelKey)}
                </Link>
              ))}
          </div>
        </div>
      </div>

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
