import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import {
  AccountToggle,
  RefreshAccountsButton,
} from "@/components/expenses/buttons";
import { SetupCategories } from "@/components/expenses/categories";
import { PageHeader } from "@/components/page-header";
import { Loading, Skeleton } from "@/components/skeletons";
import { getExpenseSettings, getExpensesState } from "@/lib/expenses/queries";

export const metadata: Metadata = { title: "Set up expenses" };

export default function SetupPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Expenses", href: "/expenses" }]}
        title="Set up expenses"
        description="Two steps: pick the accounts, then agree the categories. After that it runs by itself every morning."
      />
      <Suspense
        fallback={
          <Loading>
            <Skeleton className="h-48" />
          </Loading>
        }
      >
        <Setup />
      </Suspense>
    </>
  );
}

async function Setup() {
  const state = await getExpensesState();
  if (state.setUp) redirect("/expenses");
  if (!state.investec) {
    return (
      <EmptyState title="Investec isn't connected">
        Add the Investec API credentials to the environment first (see
        apps/admin/.env.example).
      </EmptyState>
    );
  }
  const { accounts } = await getExpenseSettings();
  const included = accounts.filter((a) => a.included).length;
  return (
    <ol className="grid gap-10">
      <li>
        <h2 className="text-lg font-bold">1. Accounts</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Which accounts hold your personal spending? Savings and investment
          accounts are usually better left out: money moving into them is
          saving, not spending.
        </p>
        {accounts.length ? (
          <ul className="mb-3 grid gap-2">
            {accounts.map((a) => (
              <li
                key={a.accountId}
                className="flex flex-wrap items-baseline gap-2"
              >
                <AccountToggle
                  accountId={a.accountId}
                  included={a.included}
                  name={a.name}
                />
                <span className="text-xs text-muted-foreground">
                  {a.productName}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <RefreshAccountsButton />
      </li>
      <li>
        <h2 className="text-lg font-bold">2. Categories</h2>
        {included ? (
          <SetupCategories ai={state.ai} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Include at least one account first.
          </p>
        )}
      </li>
    </ol>
  );
}
