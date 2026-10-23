import type { Metadata } from "next";
import { CustomerForm } from "@/components/customer-form";
import { PageHeader } from "@/components/page-header";
import { getSettings } from "@/lib/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "New customer" };

export default async function NewCustomerPage({
  searchParams,
}: PageProps<"/customers/new">) {
  await requireSession();
  const settings = await getSettings();
  const { returnTo } = await searchParams;
  return (
    <>
      <PageHeader title="New customer" />
      <CustomerForm
        defaults={{
          currency: settings.defaultCurrency,
          termsDays: settings.defaultTermsDays,
        }}
        returnTo={typeof returnTo === "string" ? returnTo : undefined}
      />
    </>
  );
}
