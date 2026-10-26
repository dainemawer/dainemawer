import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Bone, Loading, times, widthFor } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAmounts } from "@/lib/money";
import { listCustomers } from "@/lib/queries";

export const metadata: Metadata = { title: "Customers" };

export default function CustomersPage({
  searchParams,
}: PageProps<"/customers">) {
  return (
    <Suspense
      fallback={
        <Loading>
          <CustomersSkeleton />
        </Loading>
      }
    >
      <Customers searchParams={searchParams} />
    </Suspense>
  );
}

function CustomersSkeleton() {
  return (
    <>
      <PageHeader
        title="Customers"
        actions={<Button disabled>New customer</Button>}
      />
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="h-9 w-64 rounded-md border border-input" />
        <span className="text-sm text-muted-foreground">Show archived</span>
      </div>
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
          {times(5, (i) => (
            <TableRow key={i} className="hover:bg-transparent">
              <TableCell>
                <div className="font-medium">
                  <Bone w={widthFor(i)} />
                </div>
                <div className="text-xs">
                  <Bone w={widthFor(i, 5)} />
                </div>
              </TableCell>
              <TableCell>
                <Bone w={widthFor(i, 2)} />
              </TableCell>
              <TableCell>
                <Bone w="3ch" />
              </TableCell>
              <TableCell className="text-right">
                <Bone w="9ch" />
              </TableCell>
              <TableCell className="text-right">
                <Bone w="9ch" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

async function Customers({
  searchParams,
}: Pick<PageProps<"/customers">, "searchParams">) {
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
                  {formatAmounts(outstanding, customer.currency)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmounts(paid, customer.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
