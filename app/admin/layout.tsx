import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/admin";
import { signOut } from "@/lib/actions/auth";

export const instant = false;

/** Platform admin shell — deliberately separate from the company dashboard. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/admin" className="text-lg font-bold tracking-tight text-slate-900">
            TidyPro <span className="font-normal text-slate-500">Platform Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{user.email}</span>
            <form action={signOut}>
              <button type="submit" className="text-sm font-medium text-slate-500 hover:text-slate-800">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
