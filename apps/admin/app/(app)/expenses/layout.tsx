import { Suspense } from "react";
import { ExpensesNav } from "@/components/expenses/expenses-nav";

export default function ExpensesLayout({ children }: LayoutProps<"/expenses">) {
  return (
    <>
      <Suspense fallback={<ExpensesNav />}>
        <ExpensesNav highlight />
      </Suspense>
      {children}
    </>
  );
}
