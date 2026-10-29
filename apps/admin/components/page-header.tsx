import { ChevronRight } from "lucide-react";
import Link from "next/link";

export type Crumb = { label: React.ReactNode; href: string };

/**
 * The page's title, with a breadcrumb trail above it: Dashboard, then
 * `breadcrumbs` (the pages above this one), then this page, as `current`
 * or the title. Pass `breadcrumbs={false}` on the dashboard itself.
 */
export function PageHeader({
  title,
  breadcrumbs = [],
  current,
  description,
  actions,
}: {
  title: React.ReactNode;
  breadcrumbs?: Crumb[] | false;
  /** This page's name in the trail, when the title isn't plain text or says more. */
  current?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {breadcrumbs ? (
          <Breadcrumbs
            trail={[{ label: "Dashboard", href: "/" }, ...breadcrumbs]}
            current={current ?? (typeof title === "string" ? title : null)}
          />
        ) : null}
        <h1 className="text-2xl font-bold">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

function Breadcrumbs({
  trail,
  current,
}: {
  trail: Crumb[];
  current: React.ReactNode;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-1.5 text-xs text-muted-foreground"
    >
      <ol className="flex flex-wrap items-center gap-1">
        {trail.map((crumb, i) => (
          <li key={crumb.href} className="inline-flex items-center gap-1">
            {i > 0 ? <Separator /> : null}
            <Link
              href={crumb.href}
              className="rounded-sm underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {crumb.label}
            </Link>
          </li>
        ))}
        {current ? (
          <li className="inline-flex min-w-0 items-center gap-1">
            <Separator />
            <span aria-current="page" className="truncate text-ink">
              {current}
            </span>
          </li>
        ) : null}
      </ol>
    </nav>
  );
}

function Separator() {
  return <ChevronRight aria-hidden="true" className="size-3 shrink-0" />;
}
