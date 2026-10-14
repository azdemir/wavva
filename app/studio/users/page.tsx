import { requirePlatformAdmin } from "@/lib/admin";
import { listStudioUsers } from "@/lib/studio/users";
import { Heading } from "@/components/ui/heading";
import { UsersManager } from "@/components/studio/users-manager";

export const instant = false;

export const metadata = {
  title: "Users",
  description: "Switchboard Studio — manage every SaaS user: edit email and role, or delete accounts.",
};

/** Platform-admin user management across all companies. */
export default async function StudioUsersPage() {
  await requirePlatformAdmin();
  let users: Awaited<ReturnType<typeof listStudioUsers>> = [];
  try {
    users = await listStudioUsers();
  } catch {
    users = [];
  }
  return (
    <div className="space-y-6">
      <Heading
        title="Users"
        description="Everyone with a Switchboard login, across all companies. Edit emails and roles, or remove accounts."
      />
      <UsersManager users={users} />
    </div>
  );
}
