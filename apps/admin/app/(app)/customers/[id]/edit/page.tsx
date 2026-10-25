import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CustomerForm } from "@/components/customer-form";
import { PageHeader } from "@/components/page-header";
import { FormSkeleton, HeaderSkeleton, Loading } from "@/components/skeletons";
import { getCustomer } from "@/lib/queries";

export const metadata: Metadata = { title: "Edit customer" };

export default function EditCustomerPage({
  params,
}: PageProps<"/customers/[id]/edit">) {
  return (
    <Suspense
      fallback={
        <Loading>
          <HeaderSkeleton />
          <FormSkeleton />
        </Loading>
      }
    >
      <EditCustomer params={params} />
    </Suspense>
  );
}

async function EditCustomer({
  params,
}: Pick<PageProps<"/customers/[id]/edit">, "params">) {
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
