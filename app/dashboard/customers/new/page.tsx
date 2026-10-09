import { requirePermission } from "@/lib/permissions";
import { createCustomer } from "@/lib/actions/customers";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerForm } from "@/components/customers/customer-form";

export default async function NewCustomerPage() {
  await requirePermission("customers.manage");

  return (
    <div className="max-w-2xl space-y-6">
      <Heading title="New customer" description="Add someone your business cleans for." />
      <Card>
        <CardContent className="pt-6">
          <CustomerForm action={createCustomer} submitLabel="Create customer" />
        </CardContent>
      </Card>
    </div>
  );
}
