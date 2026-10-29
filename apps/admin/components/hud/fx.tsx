import { Bone } from "@/components/skeletons";
import { formatDate } from "@/lib/documents";
import {
  changeDirection,
  FX_CURRENCIES,
  formatChange,
  formatRand,
} from "@/lib/fx";

const ARROW = { up: "▲", down: "▼", flat: "•" } as const;

import { getFxRates } from "@/lib/fx-rates";

// The HUD's exchange rates: rand per dollar, euro and pound, each with its
// change on the day and a sparkline of the last month. Data, so it streams
// inside its own <Suspense> on the dashboard.

export async function FxTile() {
  const fx = await getFxRates().catch((error) => {
    console.error("[fx]", error);
    return null;
  });
  if (!fx?.rates.length) {
    return (
      <Frame>
        <p className="mt-1 text-sm text-muted-foreground">
          Couldn't load exchange rates just now.
        </p>
      </Frame>
    );
  }
  return (
    <Frame
      note={fx.date ? `ECB reference rates, ${formatDate(fx.date)}` : null}
    >
      <ul className="mt-1 divide-y">
        {fx.rates.map(({ currency, rand, change, series }) => (
          <li key={currency} className="flex items-center gap-4 py-2">
            <span className="w-9 shrink-0 text-xs text-muted-foreground">
              {currency}
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-xl font-medium">{formatRand(rand)}</span>
              {change !== null ? (
                <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                  <span aria-hidden="true">
                    {ARROW[changeDirection(change)]}
                  </span>{" "}
                  {formatChange(change)}
                  <span className="sr-only"> on the day</span>
                </span>
              ) : null}
            </span>
            <Sparkline values={series} currency={currency} />
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function FxSkeleton() {
  return (
    <Frame>
      <ul className="mt-1 divide-y">
        {FX_CURRENCIES.map((currency) => (
          <li key={currency} className="flex items-center gap-4 py-2">
            <span className="w-9 shrink-0 text-xs text-muted-foreground">
              {currency}
            </span>
            <span className="flex-1 text-xl">
              <Bone w="7ch" />
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function Frame({
  children,
  note,
}: {
  children: React.ReactNode;
  note?: string | null;
}) {
  return (
    <section aria-label="Exchange rates" className="border-t pt-3">
      <p className="text-xs text-muted-foreground">Rand</p>
      {children}
      {note ? (
        <p className="mt-2 text-xs text-muted-foreground">{note}</p>
      ) : null}
    </section>
  );
}

const W = 96;
const H = 24;
const PAD = 3;

/**
 * A month of rates: the line in the muted tone, today's point in ink. The
 * range is in its label (and native tooltip), so it isn't sight-only.
 */
function Sparkline({
  values,
  currency,
}: {
  values: number[];
  currency: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => [
    PAD + (i / (values.length - 1)) * (W - PAD * 2),
    PAD + (1 - (v - min) / span) * (H - PAD * 2),
  ]);
  const [lastX, lastY] = points[points.length - 1];
  const label = `${currency} over the last month: low ${formatRand(min)}, high ${formatRand(max)}`;
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      className="shrink-0 overflow-visible"
    >
      <title>{label}</title>
      <polyline
        points={points
          .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
          .join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        className="text-muted-foreground/60"
      />
      <circle cx={lastX} cy={lastY} r={2.5} className="fill-ink" />
    </svg>
  );
}
