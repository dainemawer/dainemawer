import { cn } from "@/lib/utils";

// Fallbacks for the <Suspense> boundaries around each page's data. They
// ship in the prerendered static shell, so they show the moment a page is
// opened while the data streams in.
//
// Each page's fallback reuses that page's own markup (headings, labels,
// table headers, chart frames) and swaps only the data for placeholders,
// so the loaded page lands exactly where the skeleton was. <Bone> stands
// in for a run of text: it sits inside the real text element, so the
// line keeps its height.

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-muted motion-reduce:animate-none",
        className,
      )}
    />
  );
}

/** A placeholder word or number, as wide as `w` (any CSS width; `ch` suits text). */
export function Bone({
  w = "8ch",
  className,
}: {
  w?: string;
  className?: string;
}) {
  // One line tall (1lh), so it holds the line's height even as a flex item;
  // the visible bar is about the text's cap height, centred like the glyphs.
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-lh max-w-full items-center align-top"
      style={{ width: w }}
    >
      <span
        className={cn(
          "h-[0.75em] w-full animate-pulse rounded-sm bg-ink/[0.07] motion-reduce:animate-none",
          className,
        )}
      />
    </span>
  );
}

/** A status badge or filter chip's outline, empty. */
export function PillBone({
  w = "4.5rem",
  className,
}: {
  w?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-5 animate-pulse rounded-full border bg-ink/[0.04] motion-reduce:animate-none",
        className,
      )}
      style={{ width: w }}
    />
  );
}

/**
 * Stands in for a whole page body. Screen readers hear "Loading" once;
 * the placeholder layout under it is hidden from them.
 */
export function Loading({ children }: { children: React.ReactNode }) {
  return (
    // Not <output>: it only takes phrasing content, and skeletons are blocks.
    // biome-ignore lint/a11y/useSemanticElements: see above
    <div role="status">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

/** Placeholder widths that vary like real text does, picked by row so renders match. */
const WIDTHS = ["14ch", "9ch", "18ch", "11ch", "16ch", "8ch", "13ch", "20ch"];
export const widthFor = (i: number, offset = 0) =>
  WIDTHS[(i + offset) % WIDTHS.length];

/** `n` placeholder items: `Array.from` with keys that biome accepts. */
export function times<T>(n: number, render: (i: number) => T): T[] {
  return Array.from({ length: n }, (_, i) => render(i));
}

/** A page header whose title (and breadcrumb trail) are data. */
export function HeaderSkeleton({
  description = false,
  actions = 0,
}: {
  description?: boolean;
  /** How many action buttons to outline. */
  actions?: number;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="mb-1.5 text-xs">
          <Bone w="24ch" />
        </div>
        <div className="text-2xl font-bold">
          <Bone w="12ch" />
        </div>
        {description ? (
          <p className="mt-1 text-sm">
            <Bone w="22ch" />
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-2">
          {times(actions, (i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** The border-top stat tiles used across pages; labels are real when known. */
export function StatBone({
  label,
  strong = true,
  note = false,
}: {
  label?: string;
  strong?: boolean;
  note?: boolean;
}) {
  return (
    <div className="border-t pt-3">
      <div className="text-xs text-muted-foreground">
        {label ?? <Bone w="10ch" />}
      </div>
      <div className={cn("mt-1", strong && "text-xl font-medium")}>
        <Bone w={strong ? "9ch" : "11ch"} />
      </div>
      {note ? (
        <div className="mt-0.5 text-xs">
          <Bone w="14ch" />
        </div>
      ) : null}
    </div>
  );
}

/** Bar chart frame matching MonthlyChart / SpendingChart: gridlines, axis, bars at rest heights. */
export function BarChartSkeleton({
  height,
  bars = 12,
  paired = false,
  barWidth = paired ? 10 : 18,
}: {
  /** The chart's viewBox height (its width is always 720). */
  height: number;
  bars?: number;
  /** Two bars per month (invoiced and paid). */
  paired?: boolean;
  barWidth?: number;
}) {
  const W = 720;
  const PAD = { top: 12, right: 8, bottom: 28, left: 64 };
  const plotH = height - PAD.top - PAD.bottom;
  const base = PAD.top + plotH;
  const slot = (W - PAD.left - PAD.right) / bars;
  // A gentle, fixed rhythm: reads as "a chart" without pretending to be data.
  const shape = [
    0.45, 0.6, 0.38, 0.72, 0.55, 0.8, 0.5, 0.66, 0.42, 0.7, 0.58, 0.35,
  ];
  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      className="h-auto w-full"
      aria-hidden="true"
    >
      {times(5, (i) => (
        <line
          key={i}
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + (plotH / 4) * i}
          y2={PAD.top + (plotH / 4) * i}
          stroke="#ececec"
        />
      ))}
      <g className="animate-pulse motion-reduce:animate-none">
        {times(5, (i) => (
          <rect
            key={i}
            x={PAD.left - 44}
            y={PAD.top + (plotH / 4) * i - 4}
            width={36}
            height={8}
            rx={2}
            fill="#ececec"
          />
        ))}
        {times(bars, (i) => {
          const cx = PAD.left + slot * i + slot / 2;
          const h = plotH * shape[i % shape.length];
          return paired ? (
            <g key={i}>
              <rect
                x={cx - barWidth - 1}
                y={base - h}
                width={barWidth}
                height={h}
                rx={3}
                fill="#ececec"
              />
              <rect
                x={cx + 1}
                y={base - h * 0.8}
                width={barWidth}
                height={h * 0.8}
                rx={3}
                fill="#e0e0e0"
              />
              <rect
                x={cx - 10}
                y={height - 14}
                width={20}
                height={8}
                rx={2}
                fill="#ececec"
              />
            </g>
          ) : (
            <g key={i}>
              <rect
                x={cx - barWidth / 2}
                y={base - h}
                width={barWidth}
                height={h}
                rx={3}
                fill="#ececec"
              />
              <rect
                x={cx - 10}
                y={height - 14}
                width={20}
                height={8}
                rx={2}
                fill="#ececec"
              />
            </g>
          );
        })}
      </g>
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={base}
        y2={base}
        stroke="#cfcfcf"
      />
    </svg>
  );
}

export function FormSkeleton() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {times(6, (i) => (
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
