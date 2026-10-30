import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArchiveButton } from "@/components/archive-button";
import {
  DocumentTable,
  DocumentTableSkeleton,
} from "@/components/document-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  Bone,
  Loading,
  Skeleton,
  StatBone,
  times,
} from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { type AmountsByCurrency, addAmount, formatAmounts } from "@/lib/money";
import { getCustomer, listCustomerDocuments } from "@/lib/queries";

export async function generateMetadata({
  params,
}: PageProps<"/customers/[id]">) {
  const customer = await getCustomer((await params).id);
  return { title: customer?.company ?? "Customer" };
}

export default function CustomerPage({ params }: PageProps<"/customers/[id]">) {
  return (
    <Suspense
      fallback={
        <Loading>
          <CustomerSkeleton />
        </Loading>
      }
    >
      <Customer params={params} />
    </Suspense>
  );
}

function CustomerSkeleton() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Customers", href: "/customers" }]}
        current={<Bone w="14ch" />}
        title={<Bone w="14ch" />}
        description={<Bone w="12ch" />}
        actions={times(4, (i) => <Skeleton key={i} className="h-9 w-24" />)}
      />
      <dl className="mb-10 grid gap-6 sm:grid-cols-3">
        <StatBone label="Billed" />
        <StatBone label="Outstanding" />
        <StatBone label="Paid" />
      </dl>
      <div className="mb-10 grid gap-x-10 gap-y-4 text-sm sm:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
        <Detail label="Emails">
          <Bone w="20ch" />
        </Detail>
        <Detail label="Address">
          <Bone w="16ch" />
        </Detail>
        <Detail label="Terms">
          <Bone w="11ch" />
        </Detail>
      </div>
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold">Invoices</h2>
        <DocumentTableSkeleton kind="invoice" rows={3} customer={false} />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">Quotes</h2>
        <DocumentTableSkeleton kind="quote" rows={2} customer={false} />
      </section>
    </>
  );
}

async function Customer({
  params,
}: Pick<PageProps<"/customers/[id]">, "params">) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  const docs = await listCustomerDocuments(id);
  const invoices = docs.filter((d) => d.document.kind === "invoice");
  const quotes = docs.filter((d) => d.document.kind === "quote");
  const sum = (
    rows: typeof docs,
    amount: (d: (typeof docs)[number]["document"]) => number,
  ) =>
    rows.reduce<AmountsByCurrency>(
      (total, r) => addAmount(total, r.document.currency, amount(r.document)),
      {},
    );
  const live = invoices.filter(
    (d) => d.document.status === "sent" || d.document.status === "paid",
  );
  const billed = sum(live, (d) => d.totalMinor);
  // Part payments count as paid, and come off what's outstanding.
  const outstanding = sum(
    invoices.filter((d) => d.document.status === "sent"),
    (d) => d.totalMinor - d.paidMinor,
  );
  const paid = sum(live, (d) => d.paidMinor);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Customers", href: "/customers" }]}
        title={customer.company}
        description={customer.archivedAt ? "Archived" : customer.contactName}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/customers/${id}/edit`}>Edit</Link>
            </Button>
            <ArchiveButton id={id} archived={Boolean(customer.archivedAt)} />
            {customer.archivedAt ? null : (
              <>
                <Button asChild variant="outline">
                  <Link href={`/quotes/new?customer=${id}`}>New quote</Link>
                </Button>
                <Button asChild>
                  <Link href={`/invoices/new?customer=${id}`}>New invoice</Link>
                </Button>
              </>
            )}
          </>
        }
      />

      <dl className="mb-10 grid gap-6 sm:grid-cols-3">
        {(
          [
            ["Billed", billed],
            ["Outstanding", outstanding],
            ["Paid", paid],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="border-t pt-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-xl font-medium tabular-nums">
              {formatAmounts(value, customer.currency)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mb-10 grid gap-x-10 gap-y-4 text-sm sm:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
        <Detail label="Emails">{customer.emails.join(", ")}</Detail>
        {customer.ccEmail ? (
          <Detail label="CC">{customer.ccEmail}</Detail>
        ) : null}
        {customer.address ? (
          <Detail label="Address">{customer.address}</Detail>
        ) : null}
        {customer.taxNumber ? (
          <Detail label="Tax number">{customer.taxNumber}</Detail>
        ) : null}
        <Detail label="Terms">
          {customer.currency}, {customer.termsDays} days
        </Detail>
        {customer.notes ? (
          <Detail label="Notes">{customer.notes}</Detail>
        ) : null}
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold">Invoices</h2>
        {invoices.length ? (
          <DocumentTable rows={invoices} />
        ) : (
          <EmptyState title="No invoices yet" />
        )}
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">Quotes</h2>
        {quotes.length ? (
          <DocumentTable rows={quotes} />
        ) : (
          <EmptyState title="No quotes yet" />
        )}
      </section>
    </>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 whitespace-pre-line">{children}</div>
    </div>
  );
}
