import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import { listCustomers } from "@/lib/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({
  searchParams,
}: PageProps<"/customers">) {
  await requireSession();
  const { archived, q } = await searchParams;
  const showArchived = archived === "1";
  const query = typeof q === "string" ? q.trim().toLowerCase() : "";
  const rows = (await listCustomers({ archived: showArchived })).filter(
    ({ customer }) =>
      !query ||
      customer.company.toLowerCase().includes(query) ||
      customer.contactName?.toLowerCase().includes(query) ||
      customer.emails.some((email) => email.includes(query)),
  );

  return (
    <>
      <PageHeader
        title={showArchived ? "Archived customers" : "Customers"}
        actions={
          <Button asChild>
            <Link href="/customers/new">New customer</Link>
          </Button>
        }
      />
      <search className="mb-6">
        <form className="flex flex-wrap items-center gap-4">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search name or email"
            aria-label="Search customers"
            className="h-9 w-64 rounded-md border border-input px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          {showArchived ? (
            <input type="hidden" name="archived" value="1" />
          ) : null}
          <Link
            href={showArchived ? "/customers" : "/customers?archived=1"}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-ink hover:underline"
          >
            {showArchived ? "Show active" : "Show archived"}
          </Link>
        </form>
      </search>
      {rows.length === 0 ? (
        <EmptyState title={query ? "No matches" : "No customers yet"}>
          {query ? null : "Add one to start quoting."}
        </EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ customer, outstanding, paid }) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <Link
                    href={`/customers/${customer.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {customer.company}
                  </Link>
                  {customer.contactName ? (
                    <div className="text-xs text-muted-foreground">
                      {customer.contactName}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.emails[0]}
                </TableCell>
                <TableCell>{customer.currency}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {outstanding
                    ? formatMoney(outstanding, customer.currency)
                    : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {paid ? formatMoney(paid, customer.currency) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
