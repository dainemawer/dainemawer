// Income in rand: every paid invoice valued at the European Central Bank's
// reference rate on the day it was paid (the day the money arrived, before
// any conversion), totalled by South African tax year. Pure, so the tests
// can import it; the rates and invoices are fetched in lib/income-report.ts.
//
// ECB rates are published against the euro, so a rand rate is the ECB's own
// cross: ZAR per euro ÷ the currency per euro. Past rates never change,
// which is why nothing here is stored: the same invoice always comes out at
// the same rand amount.

import { CURRENCIES, type Currency } from "@/lib/money";

/** Rand per one unit of each currency, by ECB publication date. */
export type RandRates = Record<string, Partial<Record<Currency, number>>>;

/** Frankfurter's time series with base EUR, as rand per unit. */
export function randRatesFromEur(body: {
  rates?: Record<string, Partial<Record<string, number>>>;
}): RandRates {
  const rates: RandRates = {};
  for (const [day, perEuro] of Object.entries(body.rates ?? {})) {
    const zar = perEuro.ZAR;
    if (!zar) continue;
    const rand: Partial<Record<Currency, number>> = { EUR: zar };
    for (const currency of CURRENCIES) {
      const units = perEuro[currency];
      if (currency !== "ZAR" && currency !== "EUR" && units) {
        rand[currency] = zar / units;
      }
    }
    rates[day] = rand;
  }
  return rates;
}

/**
 * The rate in force on `date`: that day's, or the last one published
 * before it (none on weekends and holidays). Rand is always 1.
 */
export function rateOn(
  rates: RandRates,
  currency: Currency,
  date: string,
): { rate: number; date: string } | null {
  if (currency === "ZAR") return { rate: 1, date };
  let best: string | null = null;
  for (const day of Object.keys(rates)) {
    if (day <= date && rates[day][currency] && (!best || day > best)) {
      best = day;
    }
  }
  return best ? { rate: rates[best][currency] as number, date: best } : null;
}

/** Where income comes from: your employer (Fueled) or freelance clients. */
export const INCOME_TYPES = ["freelance", "employment"] as const;
export type IncomeType = (typeof INCOME_TYPES)[number];
export const INCOME_TYPE_LABEL: Record<IncomeType, string> = {
  freelance: "Freelance",
  employment: "Employment",
};

/**
 * A stream's name on screen: employment is named after the company (or
 * companies) it came from, so it reads "Fueled", not "Employment".
 */
export function streamLabel(type: IncomeType, companies: string[]): string {
  if (type === "freelance") return INCOME_TYPE_LABEL.freelance;
  const unique = [...new Set(companies)];
  return unique.length && unique.length <= 2
    ? unique.join(" & ")
    : INCOME_TYPE_LABEL.employment;
}

/** One payment against an invoice (part or all of it). */
export type Payment = {
  id: string;
  documentId: string;
  number: string;
  company: string;
  currency: Currency;
  /** This payment's amount, in the invoice's currency. */
  totalMinor: number;
  /** Less than the invoice's total: one of several payments. */
  partial: boolean;
  /** The customer's income type. */
  incomeType: IncomeType;
  paidAt: string;
};

export type IncomeLine = Payment & {
  /** Rand per unit, or null when no rate was found. */
  rate: number | null;
  /** The ECB date the rate is from (the last working day on or before payment). */
  rateDate: string | null;
  /** In rand cents, or null without a rate. */
  randMinor: number | null;
};

export function toRand(payments: Payment[], rates: RandRates): IncomeLine[] {
  return payments.map((payment) => {
    const found = rateOn(rates, payment.currency, payment.paidAt);
    return {
      ...payment,
      rate: found?.rate ?? null,
      rateDate: payment.currency === "ZAR" ? null : (found?.date ?? null),
      randMinor: found ? Math.round(payment.totalMinor * found.rate) : null,
    };
  });
}

/** Rand totals per income stream, employment first, each named for the screen. */
export function byStream(lines: IncomeLine[]) {
  return (["employment", "freelance"] as const).map((type) => {
    const mine = lines.filter((line) => line.incomeType === type);
    return {
      type,
      label: streamLabel(
        type,
        mine.map((line) => line.company),
      ),
      total: randTotal(mine),
      count: mine.length,
    };
  });
}

/** Sum of the lines that have a rand amount. */
export function randTotal(lines: IncomeLine[]): number {
  return lines.reduce((sum, line) => sum + (line.randMinor ?? 0), 0);
}

/**
 * The South African tax year (year of assessment) a date falls in: 1 March
 * to the end of February. `start` is the year it begins in.
 */
export function taxYearOf(date: string): number {
  const year = Number(date.slice(0, 4));
  return date.slice(5, 7) >= "03" ? year : year - 1;
}

export function taxYear(start: number) {
  const end = start + 1;
  // The day before 1 March: 28th, or 29th in a leap year.
  const leap = (end % 4 === 0 && end % 100 !== 0) || end % 400 === 0;
  return {
    start,
    from: `${start}-03-01`,
    to: `${end}-02-${leap ? 29 : 28}`,
    /** SARS calls it by the year it ends: "2027 tax year". */
    label: `${end} tax year`,
    span: `March ${start} – February ${end}`,
  };
}
