import Link from "next/link";
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
