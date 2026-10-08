import { requireOwner } from "@/lib/auth";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const { company } = await requireOwner();

  return (
    <div className="max-w-3xl space-y-8">
      <Heading
        title="Settings"
        description="Your company profile, pricing defaults, and policies."
      />
      <Card>
        <CardContent className="pt-6">
          <SettingsForm company={company} />
        </CardContent>
      </Card>
    </div>
  );
}
