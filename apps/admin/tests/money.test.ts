import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addAmount,
  formatAmounts,
  formatMoney,
  minorToInput,
  parseMoney,
} from "../lib/money.ts";
import {
  computeTotals,
  parseQuantity,
  parseTaxRate,
  roundDiv,
} from "../lib/totals.ts";

test("parseMoney reads typed amounts without float drift", () => {
  assert.equal(parseMoney("0.29"), 29);
  assert.equal(parseMoney("1,234.5"), 123450);
  assert.equal(parseMoney("R 99"), 9900);
  assert.equal(parseMoney("-20"), -2000);
  assert.equal(parseMoney(".5"), 50);
  assert.equal(parseMoney("1.234"), null);
  assert.equal(parseMoney("abc"), null);
  assert.equal(parseMoney(""), null);
});

test("minorToInput round-trips through parseMoney", () => {
  for (const minor of [0, 5, 29, 123450, -2000]) {
    assert.equal(parseMoney(minorToInput(minor)), minor);
  }
});

test("formatMoney uses narrow symbols per currency", () => {
  assert.equal(formatMoney(123456, "USD"), "$1,234.56");
  assert.equal(formatMoney(123456, "GBP"), "£1,234.56");
  assert.equal(formatMoney(123456, "EUR"), "€1,234.56");
  assert.equal(formatMoney(123456, "ZAR"), "R\u00a01,234.56"); // Intl puts a no-break space after "R"
});

test("roundDiv rounds half away from zero", () => {
  assert.equal(roundDiv(250, 100), 3);
  assert.equal(roundDiv(249, 100), 2);
  assert.equal(roundDiv(-250, 100), -3);
  assert.equal(roundDiv(0, 100), 0);
});

test("computeTotals: lines, discount and 15% VAT to the cent", () => {
  const totals = computeTotals(
    [
      { quantityHundredths: 150, unitPriceMinor: 99_999 }, // 1.5 × 999.99 = 1499.985 → 1499.99
      { quantityHundredths: 300, unitPriceMinor: 1_250 }, // 3 × 12.50 = 37.50
      { quantityHundredths: 100, unitPriceMinor: 1 }, // 0.01
    ],
    1_000,
    1_500,
  );
  assert.deepEqual(totals.lineAmounts, [149_999, 3_750, 1]);
  assert.equal(totals.subtotalMinor, 153_750);
  assert.equal(totals.taxMinor, 22_913); // (153750 − 1000) × 0.15 = 22912.5 → 22913
  assert.equal(totals.totalMinor, 153_750 - 1_000 + 22_913);
});

test("computeTotals with no tax and no lines", () => {
  assert.deepEqual(computeTotals([], 0, 0), {
    lineAmounts: [],
    subtotalMinor: 0,
    discountMinor: 0,
    taxMinor: 0,
    totalMinor: 0,
  });
});

test("parseQuantity and parseTaxRate", () => {
  assert.equal(parseQuantity("1.5"), 150);
  assert.equal(parseQuantity("2"), 200);
  assert.equal(parseQuantity("0.25"), 25);
  assert.equal(parseQuantity("1.255"), null);
  assert.equal(parseQuantity("-1"), null);
  assert.equal(parseTaxRate("15"), 1500);
  assert.equal(parseTaxRate("7.5"), 750);
  assert.equal(parseTaxRate("101"), null);
});

test("formatAmounts keeps currencies apart, preferred currency first", () => {
  let amounts = addAmount({}, "USD", 5000);
  amounts = addAmount(amounts, "ZAR", 100000);
  amounts = addAmount(amounts, "USD", 1000);
  assert.equal(formatAmounts(amounts, "ZAR"), "R 1,000.00 · $60.00");
  assert.equal(formatAmounts(amounts, "USD"), "$60.00 · R 1,000.00");
  assert.equal(formatAmounts({}), "—");
  assert.equal(formatAmounts({ GBP: 0 }), "—");
});
