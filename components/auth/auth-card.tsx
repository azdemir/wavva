import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";

/** Centered card shell for the sign-in / sign-up pages. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      <Container>
        <div className="flex min-h-screen flex-col items-center justify-center py-16">
          <Link href="/" className="mb-8 flex min-h-11 items-center gap-2.5">
<Logo />
          </Link>
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              {children}
              <div className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                {footer}
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
