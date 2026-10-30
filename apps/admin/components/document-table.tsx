import Link from "next/link";
import { Bone, PillBone, times, widthFor } from "@/components/skeletons";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Document } from "@/db/schema";
import { type DisplayStatus, formatDate } from "@/lib/documents";
import { formatMoney } from "@/lib/money";

export type DocumentTableRow = {
  document: Document;
  status: DisplayStatus;
  company?: string;
};

export function DocumentTable({ rows }: { rows: DocumentTableRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Number</TableHead>
          {rows[0]?.company !== undefined ? (
            <TableHead>Customer</TableHead>
          ) : null}
          <TableHead>Issued</TableHead>
          <TableHead>
            {rows[0]?.document.kind === "quote" ? "Valid until" : "Due"}
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ document, status, company }) => (
          <TableRow key={document.id}>
            <TableCell>
              <Link
                href={`/${document.kind === "quote" ? "quotes" : "invoices"}/${document.id}`}
                className="font-medium tabular-nums underline-offset-4 hover:underline"
              >
                {document.number}
              </Link>
              {document.title ? (
                <div className="max-w-xs truncate text-xs text-muted-foreground">
                  {document.title}
                </div>
              ) : null}
            </TableCell>
            {company !== undefined ? <TableCell>{company}</TableCell> : null}
            <TableCell className="text-muted-foreground tabular-nums">
              {formatDate(document.issueDate)}
            </TableCell>
            <TableCell className="text-muted-foreground tabular-nums">
              {formatDate(
                document.kind === "quote"
                  ? document.validUntil
                  : document.dueDate,
              )}
            </TableCell>
            <TableCell>
              <StatusBadge status={status} />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(document.totalMinor, document.currency)}
              {document.paidMinor > 0 && status !== "paid" ? (
                <span className="block text-xs text-muted-foreground">
                  {formatMoney(
                    document.totalMinor - document.paidMinor,
                    document.currency,
                  )}{" "}
                  due
                </span>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** DocumentTable while it loads: the same columns, placeholder rows. */
export function DocumentTableSkeleton({
  kind,
  rows = 6,
  customer = true,
}: {
  kind: "quote" | "invoice";
  rows?: number;
  /** The Customer column (left out on a customer's own page). */
  customer?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Number</TableHead>
          {customer ? <TableHead>Customer</TableHead> : null}
          <TableHead>Issued</TableHead>
          <TableHead>{kind === "quote" ? "Valid until" : "Due"}</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {times(rows, (i) => (
          <TableRow key={i} className="hover:bg-transparent">
            <TableCell>
              <div className="font-medium">
                <Bone w="11ch" />
              </div>
              {i % 3 !== 2 ? (
                <div className="text-xs">
                  <Bone w={widthFor(i, 2)} />
                </div>
              ) : null}
            </TableCell>
            {customer ? (
              <TableCell>
                <Bone w={widthFor(i)} />
              </TableCell>
            ) : null}
            <TableCell>
              <Bone w="10ch" />
            </TableCell>
            <TableCell>
              <Bone w="10ch" />
            </TableCell>
            <TableCell>
              <PillBone w="3.25rem" />
            </TableCell>
            <TableCell className="text-right">
              <Bone w="9ch" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
