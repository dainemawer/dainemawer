import assert from "node:assert/strict";
import { test } from "node:test";
import {
  chargeFlags,
  type DigestRow,
  flagsMessage,
  isDigestDay,
  weeklyMessage,
} from "../lib/expenses/digest.ts";
import type { Transaction } from "../lib/expenses/transactions.ts";

let n = 0;
const tx = (extra: Partial<Transaction>): Transaction => ({
  id: `t${n++}`,
  accountId: "a",
  date: "2026-11-01",
  postingDate: "2026-11-02",
  type: "DEBIT",
  transactionType: "CardPurchases",
  description: "WOOLWORTHS 1234",
  amountMinor: 10_000,
  ...extra,
});
const groceries = { id: "g", name: "Groceries", kind: "spending" as const };
const salary = { id: "s", name: "Salary", kind: "income" as const };
const savings = { id: "t", name: "Savings", kind: "transfer" as const };
const row = (
  extra: Partial<Transaction>,
  category: DigestRow["category"] = groceries,
): DigestRow => ({ transaction: tx(extra), category });

test("Monday is the digest day", () => {
  assert.equal(isDigestDay("2026-11-02"), true);
  assert.equal(isDigestDay("2026-11-03"), false);
  assert.equal(isDigestDay("2026-11-08"), false);
});

test("same merchant, amount and day is a possible duplicate", () => {
  const flags = chargeFlags(
    [
      row({ description: "UBER 1111" }),
      row({ description: "UBER 2222" }),
      row({ description: "UBER 3333", date: "2026-11-02" }),
      row({ description: "UBER 4444", type: "CREDIT" }),
    ],
    new Map(),
  );
  assert.equal(flags.duplicates.length, 1);
  assert.equal(flags.duplicates[0].length, 2);
});

test("a charge is large at a usual month for its category, at least R500", () => {
  const averages = new Map([["g", 300_000]]);
  const flags = chargeFlags(
    [
      row({ amountMinor: 300_000 }),
      row({ amountMinor: 299_999 }),
      row({ amountMinor: 900_000 }, salary),
      row({ amountMinor: 900_000, type: "CREDIT" }),
    ],
    averages,
  );
  assert.deepEqual(
    flags.large.map((f) => f.transaction.amountMinor),
    [300_000],
  );
  // A tiny category: the R500 floor applies.
  const small = chargeFlags(
    [row({ amountMinor: 20_000 }), row({ amountMinor: 50_000 })],
    new Map([["g", 10_000]]),
  );
  assert.deepEqual(
    small.large.map((f) => f.transaction.amountMinor),
    [50_000],
  );
  // No history: nothing is large.
  assert.deepEqual(
    chargeFlags([row({ amountMinor: 9_000_000 })], new Map()).large,
    [],
  );
});

test("a quiet weekday sends nothing", () => {
  assert.equal(flagsMessage({ duplicates: [], large: [] }, "/x"), null);
  const message = flagsMessage(
    chargeFlags([row({ amountMinor: 600_000 })], new Map([["g", 100_000]])),
    "/x",
  );
  assert.equal(message?.title, "Expenses: one charge worth a look");
  assert.match(message?.lines?.[0] ?? "", /^Large: R\s?6,000\.00/);
});

test("the weekly message sums the week, leaving transfers out", () => {
  const rows = [
    row({ amountMinor: 40_000 }),
    row({ amountMinor: 10_000, type: "CREDIT" }),
    row({ amountMinor: 2_000_000, type: "CREDIT" }, salary),
    row({ amountMinor: 500_000 }, savings),
  ];
  const message = weeklyMessage({
    rows,
    flags: { duplicates: [], large: [] },
    today: "2026-11-02",
    monthName: "November",
    spentThisMonth: 30_000,
    averageMonth: 1_000_000,
    toLabel: 2,
    url: "/x",
  });
  assert.match(message.title, /week to 2 Nov 2026/);
  assert.match(message.title, /400\.00 out/);
  assert.match(message.title, /20,100\.00 in/);
  const lines = (message.lines ?? []).filter(Boolean);
  assert.match(lines[0] ?? "", /^Most on: Groceries R\s?300\.00$/);
  assert.ok(lines.some((l) => l?.startsWith("November so far")));
  assert.ok(lines.includes("2 transactions to label"));
});
