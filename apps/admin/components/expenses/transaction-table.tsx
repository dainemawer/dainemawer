import {
  type CategoryOption,
  LabelButton,
} from "@/components/expenses/label-button";
import { Bone, PillBone, times, widthFor } from "@/components/skeletons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/documents";
import type { LabelledTransaction } from "@/lib/expenses/queries";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Live Investec rows with their labels; `extra` adds a trailing cell (Review's "Looks right"). */
export function TransactionTable({
  rows,
  categories,
  extra,
}: {
  rows: LabelledTransaction[];
  categories: CategoryOption[];
  extra?: (row: LabelledTransaction) => React.ReactNode;
}) {
  const options = categories.map(({ id, name }) => ({ id, name }));
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden w-28 sm:table-cell">Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          {extra ? (
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const { transaction: tx, label } = row;
          const credit = tx.type === "CREDIT";
          return (
            <TableRow key={tx.id}>
              <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                {formatDate(tx.date)}
              </TableCell>
              <TableCell className="max-w-36 whitespace-normal sm:max-w-xs">
                <div className="truncate" title={tx.description}>
                  {tx.description}
                </div>
                <div className="text-xs text-muted-foreground">
                  {/* The date column is hidden on phones; it moves here. */}
                  <span className="sm:hidden">{formatDate(tx.date)} · </span>
                  {splitWords(tx.transactionType)}
                </div>
              </TableCell>
              <TableCell className="max-w-28 sm:max-w-48">
                <LabelButton
                  transaction={tx}
                  label={label}
                  categories={options}
                />
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  credit && "text-success",
                )}
              >
                {credit ? "+" : "−"}
                {formatMoney(tx.amountMinor, "ZAR")}
              </TableCell>
              {extra ? <TableCell>{extra(row)}</TableCell> : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** "CardPurchases" → "Card purchases". */
function splitWords(value: string) {
  const words = value.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** TransactionTable while Investec answers: same columns, placeholder rows. */
export function TransactionTableSkeleton({
  rows = 10,
  actions = false,
}: {
  rows?: number;
  /** Review's trailing "Looks right" column. */
  actions?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden w-28 sm:table-cell">Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          {actions ? <TableHead /> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {times(rows, (i) => (
          <TableRow key={i} className="hover:bg-transparent">
            <TableCell className="hidden sm:table-cell">
              <Bone w="10ch" />
            </TableCell>
            <TableCell className="max-w-36 sm:max-w-xs">
              <div>
                <Bone w={widthFor(i, 1)} />
              </div>
              <div className="text-xs">
                <Bone w="11ch" />
              </div>
            </TableCell>
            <TableCell>
              <PillBone w={i % 2 ? "5rem" : "6.5rem"} />
            </TableCell>
            <TableCell className="text-right">
              <Bone w="9ch" />
            </TableCell>
            {actions ? (
              <TableCell>
                <Bone w="9ch" />
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
