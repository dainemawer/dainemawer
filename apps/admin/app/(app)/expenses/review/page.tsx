import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { ConfirmButton } from "@/components/expenses/buttons";
import { ExpensesGate, InvestecError } from "@/components/expenses/gate";
import {
  TransactionTable,
  TransactionTableSkeleton,
} from "@/components/expenses/transaction-table";
import { PageHeader } from "@/components/page-header";
import { Bone, Loading, Skeleton } from "@/components/skeletons";
import { getReviewQueue, listCategories } from "@/lib/expenses/queries";

export const metadata: Metadata = { title: "Review expenses" };

export default function ReviewPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Expenses", href: "/expenses" }]}
        title="Review"
        description="Transactions the AI wasn't sure about. Confirm the ones it got right; change the rest, and tick “Always do this” so it learns."
      />
      <Suspense
        fallback={
          <Loading>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm">
                <Bone w="10ch" />
              </p>
              <Skeleton className="h-9 w-28" />
            </div>
            <TransactionTableSkeleton rows={6} actions />
          </Loading>
        }
      >
        <ExpensesGate>
          <Queue />
        </ExpensesGate>
      </Suspense>
    </>
  );
}

async function Queue() {
  let queue: Awaited<ReturnType<typeof getReviewQueue>>;
  try {
    queue = await getReviewQueue();
  } catch {
    return <InvestecError />;
  }
  const categories = await listCategories();
  const { items, missing } = queue;
  if (!items.length) {
    return (
      <EmptyState title="Nothing to review">
        {missing
          ? `${missing} older item${missing === 1 ? " is" : "s are"} past Investec's history, so ${missing === 1 ? "it can't" : "they can't"} be shown.`
          : "New uncertain transactions show up here after each morning's sync."}
      </EmptyState>
    );
  }
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {items.length} to review
        </p>
        <ConfirmButton ids={items.map((item) => item.transaction.id)}>
          All look right
        </ConfirmButton>
      </div>
      <TransactionTable
        rows={items}
        categories={categories}
        extra={(row) => (
          <ConfirmButton ids={[row.transaction.id]} variant="ghost">
            Looks right
          </ConfirmButton>
        )}
      />
    </>
  );
}
