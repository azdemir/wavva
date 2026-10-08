import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const instant = false;
import { site } from "@/lib/site";
import { getSessionUser } from "@/lib/auth";
import { describeInvite, userIsMemberOf, acceptInvite } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SparkleIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Accept invite" };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-50">
      <Container>
        <div className="flex min-h-screen flex-col items-center justify-center py-16">
          <div className="mb-8 flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <SparkleIcon className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              {site.name}
            </span>
          </div>
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">{children}</CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await describeInvite(token);

  if (!invite || invite.accepted_at) {
    return (
      <Shell>
        <CardHeader className="p-0 pb-4">
          <CardTitle>Invite not found</CardTitle>
          <CardDescription>
            This invite link is invalid or has already been used. Ask your
            manager for a fresh invite.
          </CardDescription>
        </CardHeader>
        <Button href="/" variant="outline" className="w-full">
          Back to home
        </Button>
      </Shell>
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <Shell>
        <CardHeader className="p-0 pb-4">
          <CardTitle>You&apos;re invited!</CardTitle>
          <CardDescription>
            {invite.companies?.name ?? "A cleaning business"} invited{" "}
            <strong>{invite.email}</strong> to join as{" "}
            <strong>{invite.role}</strong>. Sign in (or create an account with
            that email) to accept.
          </CardDescription>
        </CardHeader>
        <div className="space-y-2">
          <Button href={`/signin?next=/invite/${token}`} className="w-full">
            Sign in to accept
          </Button>
          <Button href={`/signup`} variant="outline" className="w-full">
            Create account
          </Button>
        </div>
      </Shell>
    );
  }

  if (await userIsMemberOf(invite.company_id)) {
    redirect("/dashboard");
  }

  if (invite.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return (
      <Shell>
        <CardHeader className="p-0 pb-4">
          <CardTitle>Wrong account</CardTitle>
          <CardDescription>
            This invite was sent to <strong>{invite.email}</strong>, but
            you&apos;re signed in as <strong>{user.email}</strong>. Sign in
            with the invited address instead.
          </CardDescription>
        </CardHeader>
        <Button href="/" variant="outline" className="w-full">
          Back to home
        </Button>
      </Shell>
    );
  }

  return (
    <Shell>
      <CardHeader className="p-0 pb-4">
        <CardTitle>You&apos;re invited!</CardTitle>
        <CardDescription>
          Join <strong>{invite.companies?.name ?? "the company"}</strong> on{" "}
          {site.name}.
        </CardDescription>
      </CardHeader>
      <div className="mb-5">
        <Badge tone="brand">{invite.role}</Badge>
      </div>
      <form
        action={async () => {
          "use server";
          await acceptInvite(token);
        }}
      >
        <Button type="submit" className="w-full">
          Accept invite & enter workspace
        </Button>
      </form>
    </Shell>
  );
}
