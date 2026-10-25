import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerForm } from "@/components/customer-form";
import { PageHeader } from "@/components/page-header";
import { FormSkeleton, Loading } from "@/components/skeletons";
import { getSettings } from "@/lib/queries";
import { safeLocalPath } from "@/lib/safe-path";

export const metadata: Metadata = { title: "New customer" };

export default function NewCustomerPage({
  searchParams,
}: PageProps<"/customers/new">) {
  return (
    <>
      <PageHeader title="New customer" />
      <Suspense
        fallback={
          <Loading>
            <FormSkeleton />
          </Loading>
        }
      >
        <NewCustomer searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewCustomer({
  searchParams,
}: Pick<PageProps<"/customers/new">, "searchParams">) {
  const [settings, { returnTo }] = await Promise.all([
    getSettings(),
    searchParams,
  ]);
  return (
    <CustomerForm
      defaults={{
        currency: settings.defaultCurrency,
        termsDays: settings.defaultTermsDays,
      }}
      returnTo={
        safeLocalPath(typeof returnTo === "string" ? returnTo : null) ??
        undefined
      }
    />
  );
}
