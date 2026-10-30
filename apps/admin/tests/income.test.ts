import assert from "node:assert/strict";
import { test } from "node:test";
import {
  randRatesFromEur,
  randTotal,
  rateOn,
  taxYear,
  taxYearOf,
  toRand,
} from "../lib/income.ts";

const RATES = randRatesFromEur({
  rates: {
    "2026-10-23": { USD: 1.1, ZAR: 18.26, GBP: 0.84 },
    "2026-10-26": { USD: 1.12, ZAR: 18.592 },
  },
});

test("randRatesFromEur crosses through the euro", () => {
  assert.equal(RATES["2026-10-23"].EUR, 18.26);
  assert.ok(Math.abs((RATES["2026-10-23"].USD as number) - 16.6) < 1e-9);
  assert.ok(Math.abs((RATES["2026-10-26"].USD as number) - 16.6) < 1e-9);
  assert.equal(RATES["2026-10-26"].GBP, undefined);
});

test("rateOn uses the last rate published on or before the date", () => {
  // Sunday the 25th falls back to Friday the 23rd.
  assert.equal(rateOn(RATES, "USD", "2026-10-25")?.date, "2026-10-23");
  assert.equal(rateOn(RATES, "USD", "2026-10-26")?.date, "2026-10-26");
  assert.equal(rateOn(RATES, "USD", "2026-10-22"), null);
  // A currency missing on the latest day falls back to a day that has it.
  assert.equal(rateOn(RATES, "GBP", "2026-10-28")?.date, "2026-10-23");
  assert.deepEqual(rateOn(RATES, "ZAR", "2026-01-01"), {
    rate: 1,
    date: "2026-01-01",
  });
});

test("toRand values each payment at its own day's rate, in cents", () => {
  const lines = toRand(
    [
      {
        id: "a",
        documentId: "a",
        partial: false,
        incomeType: "freelance",
        number: "INV-1",
        company: "Acme",
        currency: "USD",
        totalMinor: 1_000_000,
        paidAt: "2026-10-24",
      },
      {
        id: "b",
        documentId: "b",
        partial: false,
        incomeType: "freelance",
        number: "INV-2",
        company: "Local",
        currency: "ZAR",
        totalMinor: 1_150_000,
        paidAt: "2026-10-26",
      },
      {
        id: "c",
        documentId: "c",
        partial: false,
        incomeType: "freelance",
        number: "INV-3",
        company: "Early",
        currency: "USD",
        totalMinor: 500,
        paidAt: "2026-01-01",
      },
    ],
    RATES,
  );
  assert.equal(lines[0].randMinor, 16_600_000);
  assert.equal(lines[0].rateDate, "2026-10-23");
  assert.equal(lines[1].randMinor, 1_150_000);
  assert.equal(lines[1].rateDate, null);
  assert.equal(lines[2].randMinor, null);
  assert.equal(randTotal(lines), 17_750_000);
});

test("tax years run March to February and are named by their end", () => {
  assert.equal(taxYearOf("2026-02-28"), 2025);
  assert.equal(taxYearOf("2026-03-01"), 2026);
  assert.deepEqual(taxYear(2027), {
    start: 2027,
    from: "2027-03-01",
    to: "2028-02-29",
    label: "2028 tax year",
    span: "March 2027 – February 2028",
  });
  assert.equal(taxYear(2026).to, "2027-02-28");
});
