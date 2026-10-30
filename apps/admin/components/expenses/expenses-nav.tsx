"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/expenses", label: "Overview" },
  { href: "/expenses/transactions", label: "Transactions" },
  { href: "/expenses/subscriptions", label: "Subscriptions" },
  { href: "/expenses/review", label: "Review" },
  { href: "/expenses/settings", label: "Settings" },
];

/** `highlight` marks the current tab; the Suspense fallback renders without it. */
export function ExpensesNav({ highlight = false }: { highlight?: boolean }) {
  return (
    <nav aria-label="Expenses" className="mb-8 border-b">
      <ul className="-mb-px flex gap-5 overflow-x-auto">
        {tabs.map((tab) =>
          highlight ? (
            <ActiveTab key={tab.href} {...tab} />
          ) : (
            <Tab key={tab.href} {...tab} active={false} />
          ),
        )}
      </ul>
    </nav>
  );
}

function ActiveTab({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active =
    href === "/expenses" ? pathname === href : pathname.startsWith(href);
  return <Tab href={href} label={label} active={active} />;
}

function Tab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "block border-b-2 pb-2 text-sm whitespace-nowrap transition-colors hover:text-ink",
          active
            ? "border-ink font-medium text-ink"
            : "border-transparent text-muted-foreground",
        )}
      >
        {label}
      </Link>
    </li>
  );
}
