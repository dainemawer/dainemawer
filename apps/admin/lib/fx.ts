// The HUD's exchange rates: what one dollar, euro and pound cost in rand,
// from the European Central Bank's daily reference rates (via Frankfurter,
// fetched in lib/fx-rates.ts). Pure, so the tests can import it.

export const FX_CURRENCIES = ["USD", "EUR", "GBP"] as const;
export type FxCurrency = (typeof FX_CURRENCIES)[number];

export type FxRate = {
  currency: FxCurrency;
  /** Rand per one unit, on the latest date. */
  rand: number;
  /** Fractional change since the previous published rate, or null with only one day. */
  change: number | null;
  /** Rand per unit for each published day, oldest first (weekends have none). */
  series: number[];
};

export type FxRates = {
  /** The ECB date of the latest rates, or null when there were none. */
  date: string | null;
  rates: FxRate[];
};

/** Frankfurter's time-series answer with base ZAR, flipped to rand per unit. */
export function fxFromSeries(body: {
  rates?: Record<string, Partial<Record<FxCurrency, number>>>;
}): FxRates {
  const days = Object.keys(body.rates ?? {}).sort();
  const rates = FX_CURRENCIES.flatMap((currency): FxRate[] => {
    const series = days
      .map((day) => body.rates?.[day]?.[currency])
      .filter((v): v is number => typeof v === "number" && v > 0)
      .map((perRand) => 1 / perRand);
    if (!series.length) return [];
    const rand = series[series.length - 1];
    const previous = series.length > 1 ? series[series.length - 2] : null;
    return [
      {
        currency,
        rand,
        change: previous ? rand / previous - 1 : null,
        series,
      },
    ];
  });
  return { date: days[days.length - 1] ?? null, rates };
}

/** `R16.65`. */
export function formatRand(rand: number): string {
  return `R${rand.toFixed(2)}`;
}

/** Up, down or flat, at the two decimals the change is shown with. */
export function changeDirection(change: number): "up" | "down" | "flat" {
  const percent = Number((change * 100).toFixed(2));
  return percent > 0 ? "up" : percent < 0 ? "down" : "flat";
}

/** `+0.42%`, `−1.10%` (a true minus sign), `0.00%`. */
export function formatChange(change: number): string {
  const percent = Math.abs(change * 100).toFixed(2);
  const direction = changeDirection(change);
  return direction === "up"
    ? `+${percent}%`
    : direction === "down"
      ? `−${percent}%`
      : "0.00%";
}
