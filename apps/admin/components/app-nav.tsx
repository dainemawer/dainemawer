"use client";

import {
  ChartGantt,
  ChevronRight,
  FileText,
  LayoutDashboard,
  type LucideIcon,
  Receipt,
  Repeat,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

const dashboard: NavItem = {
  href: "/",
  label: "Dashboard",
  icon: LayoutDashboard,
};
// Groups and the pages in them are alphabetical. Dashboard stays first and
// Settings last, the way most apps anchor them.
const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Finance",
    items: [{ href: "/expenses", label: "Expenses", icon: Wallet }],
  },
  {
    label: "Work",
    items: [
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/invoices", label: "Invoices", icon: Receipt },
      { href: "/projects", label: "Projects", icon: ChartGantt },
      { href: "/quotes", label: "Quotes", icon: FileText },
      { href: "/recurring", label: "Recurring", icon: Repeat },
    ],
  },
];
const settings: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
};
const allItems = [dashboard, ...groups.flatMap((g) => g.items), settings];

const isActive = (href: string, pathname: string | null) =>
  pathname !== null &&
  (href === "/" ? pathname === "/" : pathname.startsWith(href));

/** `highlight` marks the current page; without it (the Suspense fallback) nothing reads the pathname. */
export function AppNav({ highlight = false }: { highlight?: boolean }) {
  return highlight ? <ActiveNav /> : <Nav pathname={null} />;
}

function ActiveNav() {
  return <Nav pathname={usePathname()} />;
}

// Two lists, one shown at a time by CSS. The grouped one is the expanded
// desktop sidebar. The flat one is every page in a row on phones, and an
// icon per page (named by a tooltip) when the sidebar is collapsed, so no
// page hides inside a closed group there.
function Nav({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main">
      <ul className="flex flex-wrap gap-x-4 gap-y-2 md:flex-col md:items-center md:gap-1 md:sidebar-expanded:hidden">
        {allItems.map((item) => (
          <li key={item.href}>
            <IconLink item={item} active={isActive(item.href, pathname)} />
          </li>
        ))}
      </ul>
      <div className="hidden md:sidebar-expanded:grid md:sidebar-expanded:gap-4">
        <ul>
          <li>
            <ItemLink
              item={dashboard}
              active={isActive(dashboard.href, pathname)}
            />
          </li>
        </ul>
        {groups.map((group) => (
          <Group key={group.label} {...group} pathname={pathname} />
        ))}
        <ul>
          <li>
            <ItemLink
              item={settings}
              active={isActive(settings.href, pathname)}
            />
          </li>
        </ul>
      </div>
    </nav>
  );
}

function Group({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string | null;
}) {
  const [open, setOpen] = useState(true);
  // A closed group still shows that it holds the current page.
  const holdsActive = items.some((item) => isActive(item.href, pathname));
  return (
    <CollapsiblePrimitive.Root open={open} onOpenChange={setOpen}>
      <CollapsiblePrimitive.Trigger
        className={cn(
          "group/trigger flex w-full items-center justify-between rounded-sm py-1 text-2xs font-medium tracking-wide uppercase transition-colors outline-none hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ring/50",
          holdsActive && !open ? "text-ink" : "text-muted-foreground",
        )}
      >
        {label}
        <ChevronRight
          aria-hidden="true"
          className="size-3.5 transition-transform group-data-[state=open]/trigger:rotate-90 motion-reduce:transition-none"
        />
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
        <ul className="mt-1">
          {items.map((item) => (
            <li key={item.href}>
              <ItemLink item={item} active={isActive(item.href, pathname)} />
            </li>
          ))}
        </ul>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}

function ItemLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-sm py-1 text-sm transition-colors outline-none hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ring/50",
        active ? "font-medium text-ink" : "text-muted-foreground",
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function IconLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex items-center gap-1.5 py-1 text-sm transition-colors outline-none hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ring/50 md:size-9 md:justify-center md:rounded-md md:py-0 md:hover:bg-accent",
            active
              ? "font-medium text-ink md:bg-accent"
              : "text-muted-foreground",
          )}
        >
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          <span className="md:sr-only">{item.label}</span>
        </Link>
      </TooltipTrigger>
      {/* Only the collapsed sidebar needs it; everywhere else the label shows. */}
      <TooltipContent
        side="right"
        className="hidden md:sidebar-collapsed:block"
      >
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}
