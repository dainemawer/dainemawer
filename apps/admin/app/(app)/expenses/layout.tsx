import { Suspense } from "react";
import { ExpensesNav } from "@/components/expenses/expenses-nav";
import { Breadcrumbs, DASHBOARD } from "@/components/page-header";

export default function ExpensesLayout({ children }: LayoutProps<"/expenses">) {
  return (
    <>
      {/* One trail above the tabs for every Expenses page (each passes
          breadcrumbs={false}); the tabs say which page this is. */}
      <Breadcrumbs trail={[DASHBOARD]} current="Expenses" className="mb-4" />
      <Suspense fallback={<ExpensesNav />}>
        <ExpensesNav highlight />
      </Suspense>
      {children}
    </>
  );
}
