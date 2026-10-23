import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchiveButton } from "@/components/archive-button";
import { DocumentTable } from "@/components/document-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { getCustomer, listCustomerDocuments } from "@/lib/queries";
import { requireSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/customers/[id]">) {
  const customer = await getCustomer((await params).id);
  return { title: customer?.company ?? "Customer" };
}

export default async function CustomerPage({
  params,
}: PageProps<"/customers/[id]">) {
  await requireSession();
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  const docs = await listCustomerDocuments(id);
  const invoices = docs.filter((d) => d.document.kind === "invoice");
  const quotes = docs.filter((d) => d.document.kind === "quote");
  const sum = (rows: typeof docs) =>
    rows.reduce((total, r) => total + r.document.totalMinor, 0);
  const billed = sum(
    invoices.filter(
      (d) => d.document.status === "sent" || d.document.status === "paid",
    ),
  );
  const outstanding = sum(invoices.filter((d) => d.document.status === "sent"));
  const paid = sum(invoices.filter((d) => d.document.status === "paid"));

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/customers" className="hover:text-ink">
            Customers
          </Link>
        }
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
        {[
          ["Billed", billed],
          ["Outstanding", outstanding],
          ["Paid", paid],
        ].map(([label, value]) => (
          <div key={label as string} className="border-t pt-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-xl font-medium tabular-nums">
              {formatMoney(value as number, customer.currency)}
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
