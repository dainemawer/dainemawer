// Money is integer minor units (cents) everywhere: in the database, in
// Server Actions, in the PDF. Strings only exist at the edges — parsing
// what was typed into a form, and formatting for display.

export const CURRENCIES = ["ZAR", "USD", "GBP", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export function isCurrency(value: unknown): value is Currency {
  return CURRENCIES.includes(value as Currency);
}

const formatters = new Map<Currency, Intl.NumberFormat>();

/** `123456, "ZAR"` → `R 1,234.56` — narrow symbols, one locale for every currency. */
export function formatMoney(minor: number, currency: Currency): string {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    });
    formatters.set(currency, formatter);
  }
  return formatter.format(minor / 100);
}

/**
 * Parses a typed amount ("1,234.5", "R 99", "-20") into minor units without
 * going through a float, so "0.29" is 29 and never 28.999…. Returns null
 * for anything that isn't a number with at most two decimal places.
 */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[\s,]/g, "").replace(/^[^\d.-]+/, "");
  const match = /^(-?)(\d*)(?:\.(\d{0,2}))?$/.exec(cleaned);
  if (!match || (match[2] === "" && !match[3])) return null;
  const [, sign, whole, fraction = ""] = match;
  const minor = Number(whole || "0") * 100 + Number(fraction.padEnd(2, "0"));
  return sign ? -minor : minor;
}

/** Minor units back to the plain string a form field shows: `123450` → `"1234.50"`. */
export function minorToInput(minor: number): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** Amounts kept apart by currency: totals are never summed across currencies. */
export type AmountsByCurrency = Partial<Record<Currency, number>>;

export function addAmount(
  amounts: AmountsByCurrency,
  currency: Currency,
  minor: number,
): AmountsByCurrency {
  return { ...amounts, [currency]: (amounts[currency] ?? 0) + minor };
}

/**
 * `{ ZAR: 100000, USD: 5000 }` → `R 1,000.00 · $50.00`, the customer's own
 * currency first; zero amounts are dropped and nothing at all is `—`.
 */
export function formatAmounts(
  amounts: AmountsByCurrency,
  first?: Currency,
): string {
  const parts = CURRENCIES.filter((c) => amounts[c])
    .sort((a, b) => Number(b === first) - Number(a === first))
    .map((c) => formatMoney(amounts[c] as number, c));
  return parts.length ? parts.join(" · ") : "—";
}
