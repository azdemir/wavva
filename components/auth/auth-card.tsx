import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/lib/site";
import { Container } from "@/components/ui/container";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SparkleIcon } from "@/components/ui/icons";

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
    <div className="bg-slate-50">
      <Container>
        <div className="flex min-h-screen flex-col items-center justify-center py-16">
          <Link href="/" className="mb-8 flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <SparkleIcon className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              {site.name}
            </span>
          </Link>
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              {children}
              <div className="mt-5 text-center text-sm text-slate-500">
                {footer}
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
