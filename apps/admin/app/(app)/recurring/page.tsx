import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RecurringStatusBadge } from "@/components/recurring-status";
import { Loading, TableSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/documents";
import { formatMoney } from "@/lib/money";
import { listRecurring } from "@/lib/queries";
import { INTERVAL_LABEL } from "@/lib/recurring-dates";

export const metadata: Metadata = { title: "Recurring invoices" };

export default function RecurringPage() {
  return (
    <>
      <PageHeader
        title="Recurring"
        description="Each schedule creates a draft invoice on its date and emails you to review it. Nothing goes to a client until you send it."
        actions={
          <Button asChild>
            <Link href="/recurring/new">New recurring invoice</Link>
          </Button>
        }
      />
      <Suspense
        fallback={
          <Loading>
            <TableSkeleton rows={3} />
          </Loading>
        }
      >
        <RecurringList />
      </Suspense>
    </>
  );
}

async function RecurringList() {
  const rows = await listRecurring();
  return rows.length ? (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Repeats</TableHead>
          <TableHead>Next invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ schedule, company, status }) => (
          <TableRow key={schedule.id}>
            <TableCell>
              <Link
                href={`/recurring/${schedule.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {company}
              </Link>
              {schedule.title ? (
                <div className="max-w-xs truncate text-xs text-muted-foreground">
                  {schedule.title}
                </div>
              ) : null}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {INTERVAL_LABEL[schedule.interval]}
            </TableCell>
            <TableCell className="text-muted-foreground tabular-nums">
              {status === "active" ? formatDate(schedule.nextIssueDate) : "—"}
            </TableCell>
            <TableCell>
              <RecurringStatusBadge status={status} />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(schedule.totalMinor, schedule.currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ) : (
    <EmptyState title="No recurring invoices yet">
      Set one up for a retainer or anything you bill on a schedule.
    </EmptyState>
  );
}
