import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";
import { Badge } from "@/components/ui/badge";
import { SubscriptionBanner } from "@/components/billing/subscription-banner";
import { PLANS, isPlanId } from "@/lib/plans";

// Workspace routes render per request (auth session) — never prerendered.
export const instant = false;
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

type NavItem = {
  href: string;
  label: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  soon?: boolean;
  /** If set, only shown to plans that include this feature. */
  feature?: PlanFeature;
};

const nav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/dashboard/customers", label: "Customers", icon: UsersIcon },
  { href: "/dashboard/services", label: "Services & Pricing", icon: TagIcon },
  { href: "/dashboard/quotes", label: "Quotes", icon: QuoteIcon },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarIcon },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarIcon, feature: "schedule" },
  { href: "/dashboard/my-jobs", label: "My jobs", icon: ClockIcon },
  { href: "/dashboard/invoices", label: "Invoices", icon: CardIcon },
  { href: "/dashboard/reports", label: "Reports", icon: ChartIcon, feature: "reports" },
  { href: "/dashboard/billing", label: "Billing", icon: CardIcon },
  { href: "/dashboard/team", label: "Team", icon: UsersIcon },
  { href: "/dashboard/settings", label: "Settings", icon: GearIcon },
  { href: "/dashboard/audit", label: "Audit log", icon: BellIcon },
];

function NavLinks({ onNavigate, plan }: { onNavigate?: () => void; plan: "starter" | "growth" | "pro" }) {
  const visible = nav.filter(
    (item) => !item.feature || hasFeature(plan, item.feature),
  );
  return (
    <nav className="space-y-1" aria-label="Workspace">
      {visible.map((item) => {
        const Icon = item.icon;
        const content = (
          <>
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.soon && (
              <Badge tone="slate" className="text-[10px]">
                Soon
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
            title="Coming in a later stage"
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
          aria-label="Back to website home"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 3 3 10h3v7h4v-5h4v5h4v-7h3L10 3z" />
          </svg>
          <span className="flex-1">Website home</span>
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

  return (
    <div className="min-h-screen bg-slate-50 md:flex dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-full flex-col">
          <Link href="/dashboard" className="flex items-center gap-2.5 px-5 pb-5 pt-6">
<LogoMark className="h-9 w-9" />
          </Link>
          <div className="flex-1 overflow-y-auto px-3">
            <NavLinks plan={plan} />
          </div>
          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <p className="truncate text-sm font-semibold text-slate-900">
              {company.name}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user.email} · {membership.role}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm font-medium text-slate-500 hover:text-slate-800"
                >
                  Sign out
                </button>
              </form>
              <ThemeToggle className="h-8 w-8" />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="border-b border-slate-200 bg-white md:hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
<Logo />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-8 w-8" />
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
        <div className="overflow-x-auto px-4 pb-3">
          <div className="flex gap-1">
            <Link
              href="/"
              aria-label="Back to website home"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              ⌂ Home
            </Link>
            {nav
              .filter((n) => !n.soon && (!n.feature || hasFeature(plan, n.feature)))
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  {item.label}
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
  );
}
