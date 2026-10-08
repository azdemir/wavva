import type { ReactNode } from "react";
import { site } from "@/lib/site";
import { Container } from "@/components/ui/container";
import { LogoMark } from "@/components/ui/logo";

/** Minimal branded shell for the customer portal (no login required). */
export function PortalShell({
  companyName,
  customerName,
  children,
}: {
  companyName: string;
  customerName: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <Container>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-8 w-8" />
              <div>
                <p className="text-sm font-bold text-slate-900">{companyName}</p>
                <p className="text-xs text-slate-500">powered by {site.name}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">Hi, {customerName}</p>
          </div>
        </Container>
      </header>
      <Container>
        <div className="mx-auto max-w-3xl py-8">{children}</div>
      </Container>
    </div>
  );
}

export function PortalInvalid() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Container>
        <div className="mx-auto max-w-md py-24 text-center">
          <h1 className="text-xl font-bold text-slate-900">Link not valid</h1>
          <p className="mt-2 text-sm text-slate-600">
            This portal link is invalid or has expired. Ask {`your cleaning company`} for a fresh link.
          </p>
        </div>
      </Container>
    </div>
  );
}
