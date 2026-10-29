import assert from "node:assert/strict";
import { test } from "node:test";
import {
  changeDirection,
  formatChange,
  formatRand,
  fxFromSeries,
} from "../lib/fx.ts";

test("fxFromSeries flips ZAR-based rates to rand per unit, oldest first", () => {
  const fx = fxFromSeries({
    rates: {
      "2026-10-28": { USD: 0.06, EUR: 0.05 },
      "2026-10-27": { USD: 0.0625, EUR: 0.05 },
    },
  });
  assert.equal(fx.date, "2026-10-28");
  const usd = fx.rates.find((r) => r.currency === "USD");
  assert.ok(usd);
  assert.deepEqual(usd.series, [16, 1 / 0.06]);
  assert.ok(Math.abs((usd.change ?? 0) - (1 / 0.06 / 16 - 1)) < 1e-12);
  assert.equal(fx.rates.find((r) => r.currency === "EUR")?.change, 0);
});

test("fxFromSeries leaves out a currency with no rates", () => {
  const fx = fxFromSeries({ rates: { "2026-10-28": { USD: 0.06 } } });
  assert.deepEqual(
    fx.rates.map((r) => r.currency),
    ["USD"],
  );
  assert.equal(fx.rates[0].change, null);
  assert.deepEqual(fxFromSeries({}), { date: null, rates: [] });
});

test("formatRand and formatChange", () => {
  assert.equal(formatRand(16.6477), "R16.65");
  assert.equal(formatChange(0.0042), "+0.42%");
  assert.equal(formatChange(-0.011), "−1.10%");
  assert.equal(formatChange(0.00001), "0.00%");
  assert.equal(formatChange(-0.00001), "0.00%");
  assert.equal(changeDirection(-0.00001), "flat");
  assert.equal(changeDirection(-0.0002), "down");
});
