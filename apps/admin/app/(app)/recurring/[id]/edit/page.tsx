import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { customerOptions } from "@/components/document-pages";
import { PageHeader } from "@/components/page-header";
import { RecurringForm } from "@/components/recurring-form";
import { FormSkeleton, HeaderSkeleton, Loading } from "@/components/skeletons";
import { minorToInput } from "@/lib/money";
import { getRecurring } from "@/lib/queries";
import { formatQuantity, formatTaxRate } from "@/lib/totals";

export const metadata: Metadata = { title: "Edit recurring invoice" };

export default function EditRecurringPage({
  params,
}: PageProps<"/recurring/[id]/edit">) {
  return (
    <Suspense
      fallback={
        <Loading>
          <HeaderSkeleton />
          <FormSkeleton />
        </Loading>
      }
    >
      <EditRecurring params={params} />
    </Suspense>
  );
}

async function EditRecurring({
  params,
}: Pick<PageProps<"/recurring/[id]/edit">, "params">) {
  const { id } = await params;
  const full = await getRecurring(id);
  if (!full) notFound();
  const { schedule, customer, lines } = full;
  const customers = await customerOptions(schedule.customerId);

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Recurring", href: "/recurring" },
          { label: customer.company, href: `/recurring/${id}` },
        ]}
        current="Edit"
        title="Edit recurring invoice"
        description="Changes apply to invoices created from now on. Ones already created keep what they had."
      />
      <RecurringForm
        customers={customers}
        initial={{
          id: schedule.id,
          customerId: schedule.customerId,
          currency: schedule.currency,
          interval: schedule.interval,
          nextIssueDate: schedule.nextIssueDate,
          endDate: schedule.endDate ?? "",
          title: schedule.title ?? "",
          notes: schedule.notes ?? "",
          terms: schedule.terms ?? "",
          discount: schedule.discountMinor
            ? minorToInput(schedule.discountMinor)
            : "",
          taxRate: formatTaxRate(schedule.taxRateBp),
          lines: lines.map((line) => ({
            description: line.description,
            quantity: formatQuantity(line.quantityHundredths),
            unitPrice: minorToInput(line.unitPriceMinor),
          })),
        }}
      />
    </>
  );
}
