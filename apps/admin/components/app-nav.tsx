"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/quotes", label: "Quotes" },
  { href: "/invoices", label: "Invoices" },
  { href: "/recurring", label: "Recurring" },
  { href: "/customers", label: "Customers" },
  { href: "/expenses", label: "Expenses" },
  { href: "/projects", label: "Projects" },
  { href: "/settings", label: "Settings" },
];

/** `highlight` marks the current section; without it (the Suspense fallback) nothing reads the pathname. */
export function AppNav({ highlight = false }: { highlight?: boolean }) {
  return (
    <nav aria-label="Main">
      <ul className="flex flex-wrap gap-x-5 gap-y-2 md:flex-col md:gap-1">
        {links.map((link) =>
          highlight ? (
            <ActiveItem key={link.href} {...link} />
          ) : (
            <Item key={link.href} {...link} active={false} />
          ),
        )}
      </ul>
    </nav>
  );
}

function ActiveItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return <Item href={href} label={label} active={active} />;
}

function Item({
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
          "block py-1 text-sm transition-colors hover:text-ink",
          active ? "font-medium text-ink" : "text-muted-foreground",
        )}
      >
        {label}
      </Link>
    </li>
  );
}
