// The one place document arithmetic happens. Quantities are hundredths
// (1.5 hours = 150) so a line amount is an integer product divided once,
// rounded half away from zero — the same rule for the editor's live
// totals, the stored totals and the PDF.

export type LineInput = { quantityHundredths: number; unitPriceMinor: number };

export type Totals = {
  lineAmounts: number[];
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
};

/** Divides and rounds half away from zero: `roundDiv(250, 100)` is 3, `roundDiv(-250, 100)` is -3. */
export function roundDiv(numerator: number, denominator: number): number {
  const sign = Math.sign(numerator);
  return (
    sign *
    Math.floor((Math.abs(numerator) * 2 + denominator) / (denominator * 2))
  );
}

export function lineAmount(line: LineInput): number {
  return roundDiv(line.quantityHundredths * line.unitPriceMinor, 100);
}

export function computeTotals(
  lines: LineInput[],
  discountMinor: number,
  taxRateBasisPoints: number,
): Totals {
  const lineAmounts = lines.map(lineAmount);
  const subtotalMinor = lineAmounts.reduce((sum, amount) => sum + amount, 0);
  const taxable = subtotalMinor - discountMinor;
  const taxMinor = roundDiv(taxable * taxRateBasisPoints, 10_000);
  return {
    lineAmounts,
    subtotalMinor,
    discountMinor,
    taxMinor,
    totalMinor: taxable + taxMinor,
  };
}

/** "1.5" → 150, "2" → 200. Null for more than two decimals or anything non-numeric. */
export function parseQuantity(input: string): number | null {
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(input.trim());
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
}

/** 150 → "1.5", 200 → "2". */
export function formatQuantity(hundredths: number): string {
  return String(hundredths / 100);
}

/** "15" or "15.5" (percent) → basis points. */
export function parseTaxRate(input: string): number | null {
  const match = /^(\d{1,3})(?:\.(\d{0,2}))?$/.exec(input.trim());
  if (!match) return null;
  const bp = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return bp <= 10_000 ? bp : null;
}

export function formatTaxRate(basisPoints: number): string {
  return String(basisPoints / 100);
}
