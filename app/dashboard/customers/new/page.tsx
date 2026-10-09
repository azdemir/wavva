import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/permissions";
import { createCustomer } from "@/lib/actions/customers";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerForm } from "@/components/customers/customer-form";

export default async function NewCustomerPage() {
  await requirePermission("customers.manage");
  const t = await getTranslations("customers");

  return (
    <div className="max-w-2xl space-y-6">
      <Heading title={t("new.title")} description={t("new.description")} />
      <Card>
        <CardContent className="pt-6">
          <CustomerForm action={createCustomer} submitLabel={t("new.submitLabel")} />
        </CardContent>
      </Card>
    </div>
  );
}
