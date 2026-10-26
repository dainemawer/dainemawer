import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { getExpensesState } from "@/lib/expenses/queries";

/** Shows its children once Investec is connected and categories exist; otherwise the next step. */
export async function ExpensesGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = await getExpensesState();
  if (!state.investec) {
    return (
      <EmptyState title="Investec isn't connected">
        Add <code>INVESTEC_CLIENT_ID</code>, <code>INVESTEC_CLIENT_SECRET</code>{" "}
        and <code>INVESTEC_API_KEY</code> to the environment, then reload.
        Create them in Investec Online under Programmable Banking, with the
        accounts, balances and transactions scopes.
      </EmptyState>
    );
  }
  if (!state.setUp) {
    return (
      <EmptyState title="Set up your categories">
        <p>
          Choose which accounts to analyse, and let the AI suggest categories
          from your history.
        </p>
        <Button asChild className="mt-4">
          <Link href="/expenses/setup">Get started</Link>
        </Button>
      </EmptyState>
    );
  }
  return children;
}

/** For anything that calls Investec live: a failure there shouldn't break the page. */
export function InvestecError() {
  return (
    <EmptyState title="Couldn't reach Investec">
      Try again in a minute. If it keeps failing, check the API credentials and
      their scopes in Investec Online.
    </EmptyState>
  );
}
