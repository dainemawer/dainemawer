import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { customerOptions } from "@/components/document-pages";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RecurringForm } from "@/components/recurring-form";
import { FormSkeleton, Loading } from "@/components/skeletons";
import { addDays } from "@/lib/documents";
import { getSettings } from "@/lib/queries";
import { getToday } from "@/lib/today";
import { formatTaxRate } from "@/lib/totals";

export const metadata: Metadata = { title: "New recurring invoice" };

export default function NewRecurringPage({
  searchParams,
}: PageProps<"/recurring/new">) {
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/recurring" className="hover:text-ink">
            Recurring
          </Link>
        }
        title="New recurring invoice"
      />
      <Suspense
        fallback={
          <Loading>
            <FormSkeleton />
          </Loading>
        }
      >
        <NewRecurring searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewRecurring({
  searchParams,
}: Pick<PageProps<"/recurring/new">, "searchParams">) {
  const [customers, settings, { customer: chosen }] = await Promise.all([
    customerOptions(),
    getSettings(),
    searchParams,
  ]);
  // Back from "Add a new customer" with ?customer=<id>.
  const customer = customers.find((c) => c.id === chosen);

  return customers.length === 0 ? (
    <EmptyState title="Add a customer first">
      <Link
        href="/customers/new?returnTo=/recurring/new"
        className="underline underline-offset-4"
      >
        Create a customer
      </Link>{" "}
      to bill them on a schedule.
    </EmptyState>
  ) : (
    <RecurringForm
      customers={customers}
      initial={{
        customerId: customer?.id ?? "",
        currency: customer?.currency ?? settings.defaultCurrency,
        interval: "monthly",
        // Tomorrow: today's run may already have happened.
        nextIssueDate: addDays(await getToday(), 1),
        endDate: "",
        title: "",
        notes: settings.defaultNotes ?? "",
        terms: settings.invoiceTerms ?? "",
        discount: "",
        taxRate: formatTaxRate(settings.defaultTaxRateBp),
        lines: [],
      }}
    />
  );
}
