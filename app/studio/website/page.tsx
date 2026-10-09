import { requirePlatformAdmin } from "@/lib/admin";
import { getContentOverrides } from "@/lib/studio/content";
import { Heading } from "@/components/ui/heading";
import { WebsiteEditor } from "@/components/studio/website-editor";

export const instant = false;

/**
 * No-code website editor. Every editable piece of marketing copy comes from
 * the content registry; saving revalidates the affected pages so edits go
 * live without a redeploy.
 */
export default async function WebsitePage() {
  await requirePlatformAdmin();
  const overrides = await getContentOverrides();

  return (
    <div className="space-y-6">
      <Heading
        title="Website editor"
        description="Change any text on the marketing site — no code, no deploy. Saving publishes the change immediately."
      />
      <WebsiteEditor initialOverrides={overrides} />
    </div>
  );
}
