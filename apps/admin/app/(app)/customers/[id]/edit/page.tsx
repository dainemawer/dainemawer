import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/customer-form";
import { PageHeader } from "@/components/page-header";
import { getCustomer } from "@/lib/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Edit customer" };

export default async function EditCustomerPage({
  params,
}: PageProps<"/customers/[id]/edit">) {
  await requireSession();
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  return (
    <>
      <PageHeader eyebrow="Edit customer" title={customer.company} />
      <CustomerForm
        customer={customer}
        defaults={{
          currency: customer.currency,
          termsDays: customer.termsDays,
        }}
      />
    </>
  );
}
