import { getTranslations } from "next-intl/server";
import { Heading } from "@/components/ui/heading";
import { ArcadeShell } from "@/components/arcade/arcade-shell";

/** Switchboard Arcade — short, silly games for the team. Every role, every tier. */
export default async function ArcadePage() {
  const t = await getTranslations("arcade");
  return (
    <div className="max-w-4xl space-y-6">
      <Heading title={t("title")} description={t("description")} />
      <ArcadeShell />
    </div>
  );
}
