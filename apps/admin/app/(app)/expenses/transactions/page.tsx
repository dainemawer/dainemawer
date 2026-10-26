import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { ExpensesGate, InvestecError } from "@/components/expenses/gate";
import {
  TransactionTable,
  TransactionTableSkeleton,
} from "@/components/expenses/transaction-table";
import { PageHeader } from "@/components/page-header";
import { Bone, Loading, PillBone, times } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import {
  type LabelledTransaction,
  listCategories,
  listMonthTransactions,
} from "@/lib/expenses/queries";
import { monthOf, netFor } from "@/lib/expenses/transactions";
import { formatMoney } from "@/lib/money";
import { getToday } from "@/lib/today";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Expense transactions" };

export default function TransactionsPage({
  searchParams,
}: PageProps<"/expenses/transactions">) {
  return (
    <>
      <PageHeader
        title="Transactions"
        description="Live from Investec. Click a category to change it, and to teach the classifier."
      />
      <Suspense
        fallback={
          <Loading>
            <TransactionsSkeleton />
          </Loading>
        }
      >
        <ExpensesGate>
          <Transactions searchParams={searchParams} />
        </ExpensesGate>
      </Suspense>
    </>
  );
}

function TransactionsSkeleton() {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            ←
          </Button>
          <span className="min-w-36 text-center font-medium">
            <Bone w="12ch" />
          </span>
          <Button variant="outline" size="sm" disabled>
            →
          </Button>
        </div>
        <p className="text-sm">
          <Bone w="26ch" />
        </p>
      </div>
      <div className="mb-6 flex flex-wrap gap-1.5">
        {times(9, (i) => (
          <PillBone key={i} w={["2.25rem", "5rem", "4rem", "6rem"][i % 4]} />
        ))}
      </div>
      <TransactionTableSkeleton rows={12} />
    </>
  );
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

function shiftMonth(month: string, by: number) {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(year, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function Transactions({
  searchParams,
}: Pick<PageProps<"/expenses/transactions">, "searchParams">) {
  const [params, today, categories] = await Promise.all([
    searchParams,
    getToday(),
    listCategories(),
  ]);
  const thisMonth = today.slice(0, 7);
  const requested = typeof params.month === "string" ? params.month : "";
  const month =
    MONTH.test(requested) && requested <= thisMonth ? requested : thisMonth;
  const categoryId =
    typeof params.category === "string" ? params.category : undefined;
  const category = categories.find((c) => c.id === categoryId);

  let rows: LabelledTransaction[];
  try {
    rows = await listMonthTransactions(monthOf(`${month}-01`));
  } catch {
    return <InvestecError />;
  }
  const shown = category
    ? rows.filter((r) => r.label?.categoryId === category.id)
    : rows;
  const query = (m: string) =>
    `/expenses/transactions?month=${m}${category ? `&category=${category.id}` : ""}`;
  const label = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));

  const counted = shown.filter(
    (r) => r.category && r.category.kind !== "transfer",
  );
  const out = counted
    .filter((r) => r.transaction.type === "DEBIT")
    .reduce((sum, r) => sum + r.transaction.amountMinor, 0);
  const incoming = counted
    .filter((r) => r.transaction.type === "CREDIT")
    .reduce((sum, r) => sum + r.transaction.amountMinor, 0);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Month" className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link
              href={query(shiftMonth(month, -1))}
              aria-label="Previous month"
            >
              ←
            </Link>
          </Button>
          <span className="min-w-36 text-center font-medium">{label}</span>
          {month < thisMonth ? (
            <Button asChild variant="outline" size="sm">
              <Link href={query(shiftMonth(month, 1))} aria-label="Next month">
                →
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              aria-label="Next month"
            >
              →
            </Button>
          )}
        </nav>
        <p className="text-sm text-muted-foreground tabular-nums">
          {formatMoney(out, "ZAR")} out · {formatMoney(incoming, "ZAR")} in
          {category ? (
            <>
              {" "}
              ·{" "}
              {category.kind === "transfer"
                ? "transfers aren't counted"
                : `net ${formatMoney(
                    netFor(category.kind, { outMinor: out, inMinor: incoming }),
                    "ZAR",
                  )}`}
            </>
          ) : null}
        </p>
      </div>

      <nav aria-label="Category" className="mb-6 flex flex-wrap gap-1.5">
        <FilterLink
          href={`/expenses/transactions?month=${month}`}
          active={!category}
        >
          All
        </FilterLink>
        {categories.map((c) => (
          <FilterLink
            key={c.id}
            href={`/expenses/transactions?month=${month}&category=${c.id}`}
            active={c.id === category?.id}
          >
            {c.name}
          </FilterLink>
        ))}
      </nav>

      {shown.length ? (
        <TransactionTable rows={shown} categories={categories} />
      ) : (
        <EmptyState title="No transactions">
          {category
            ? `Nothing in ${category.name} for ${label}.`
            : `Nothing posted in ${label} on the included accounts. Investec returns about six months of history.`}
        </EmptyState>
      )}
    </>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
        active
          ? "border-ink bg-ink text-background"
          : "text-muted-foreground hover:border-ink/40 hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
