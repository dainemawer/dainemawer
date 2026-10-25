import { cn } from "@/lib/utils";

// Fallbacks for the <Suspense> boundaries around each page's data. They
// ship in the prerendered static shell, so they show the moment a page is
// opened while the data streams in. Shaped like what replaces them, to
// keep the layout from jumping.

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
    />
  );
}

/** Stands in for a whole page body; announces itself once. */
export function Loading({ children }: { children: React.ReactNode }) {
  return (
    // Not <output>: it only takes phrasing content, and skeletons are blocks.
    // biome-ignore lint/a11y/useSemanticElements: see above
    <div role="status" aria-label="Loading">
      {children}
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="mb-8 grid gap-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-56" />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid gap-px border-y">
      {Array.from({ length: rows }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
        <Skeleton key={i} className="h-12 rounded-none bg-muted/60" />
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="mb-10 grid gap-6 sm:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
        <div key={i} className="grid gap-2 border-t pt-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-28" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 6 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
          <div key={i} className="grid gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9" />
          </div>
        ))}
      </div>
      <Skeleton className="h-40" />
    </div>
  );
}
