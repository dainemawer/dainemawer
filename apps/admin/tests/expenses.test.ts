import assert from "node:assert/strict";
import { test } from "node:test";
import { MockLanguageModelV4 } from "ai/test";
import { classifyMerchants } from "../lib/expenses/ai.ts";
import {
  categoryTrends,
  matchRule,
  merchantKey,
  monthEnd,
  monthlyTotals,
  monthsBetween,
  postingDateFromId,
  suggestPattern,
  type Transaction,
  taxYearStart,
} from "../lib/expenses/transactions.ts";

const tx = (over: Partial<Transaction>): Transaction => ({
  id: "87446202610140010600",
  accountId: "a",
  date: "2026-10-13",
  postingDate: "2026-10-14",
  type: "DEBIT",
  transactionType: "CardPurchases",
  description: "SUPERSPAR KURUMAN KURUMAN ZA",
  amountMinor: 10_000,
  ...over,
});

test("merchantKey drops reference numbers, spacing and the country code", () => {
  assert.equal(
    merchantKey("GP SCHEEPERS      65367 BRITS ZA"),
    "GP SCHEEPERS BRITS",
  );
  assert.equal(merchantKey("FNB H LOAN 0000300001"), "FNB H LOAN");
  assert.equal(
    merchantKey("NETFLIX.COM AMSTERDAM NL"),
    "NETFLIX.COM AMSTERDAM",
  );
  assert.equal(merchantKey("Uber Eats"), "UBER EATS");
});

test("matchRule picks the longest matching pattern", () => {
  const rules = [
    { id: 1, pattern: "UBER" },
    { id: 2, pattern: "uber eats" },
  ];
  assert.equal(matchRule("UBER EATS SANDTON ZA", rules)?.id, 2);
  assert.equal(matchRule("UBER TRIP 1234567 ZA", rules)?.id, 1);
  assert.equal(matchRule("BOLT RIDE", rules), undefined);
});

test("suggestPattern starts from a distinctive first word", () => {
  assert.equal(suggestPattern("TAKEALOT ONLINE 2 CAPE TOWN ZA"), "TAKEALOT");
  assert.equal(suggestPattern("FNB H LOAN 0000300001"), "FNB H");
});

test("month helpers", () => {
  assert.deepEqual(monthsBetween("2026-11-20", "2027-02-03"), [
    "2026-11-01",
    "2026-12-01",
    "2027-01-01",
    "2027-02-01",
  ]);
  assert.equal(monthEnd("2028-02-01"), "2028-02-29");
  assert.equal(monthEnd("2026-04-01"), "2026-04-30");
  assert.equal(taxYearStart("2027-02-28"), "2026-03-01");
  assert.equal(taxYearStart("2027-03-01"), "2027-03-01");
});

test("postingDateFromId reads Investec's uuid", () => {
  assert.equal(postingDateFromId("87446202607290010600"), "2026-07-29");
  assert.equal(postingDateFromId("not-an-id"), null);
});

test("monthlyTotals splits money out, refunds and deductible spend; skips unlabelled", () => {
  const transactions = [
    tx({ id: "1", amountMinor: 10_000 }),
    tx({ id: "2", type: "CREDIT", amountMinor: 2_500 }),
    tx({ id: "3", amountMinor: 30_000, postingDate: "2026-09-30" }),
    tx({ id: "4", amountMinor: 99_900 }),
    tx({ id: "5", amountMinor: 1 }),
  ];
  const labels = new Map([
    ["1", { categoryId: "food", deductible: false }],
    ["2", { categoryId: "food", deductible: false }],
    ["3", { categoryId: "food", deductible: false }],
    ["4", { categoryId: "work", deductible: true }],
  ]);
  const totals = monthlyTotals(transactions, labels);
  const find = (month: string, id: string) =>
    totals.find((t) => t.month === month && t.categoryId === id);
  assert.deepEqual(find("2026-10-01", "food"), {
    month: "2026-10-01",
    categoryId: "food",
    outMinor: 10_000,
    inMinor: 2_500,
    deductibleOutMinor: 0,
    count: 2,
  });
  assert.equal(find("2026-09-01", "food")?.outMinor, 30_000);
  assert.equal(find("2026-10-01", "work")?.deductibleOutMinor, 99_900);
  assert.equal(totals.length, 3);
});

test("categoryTrends averages previous months and ignores transfers and pre-history", () => {
  const kinds = new Map([
    ["food", "spending" as const],
    ["savings", "transfer" as const],
  ]);
  const row = (month: string, categoryId: string, outMinor: number) => ({
    month,
    categoryId,
    outMinor,
    inMinor: 0,
    deductibleOutMinor: 0,
    count: 1,
  });
  const trends = categoryTrends(
    [
      row("2026-08-01", "food", 300),
      row("2026-09-01", "food", 600),
      row("2026-10-01", "food", 500),
      row("2026-10-01", "savings", 9_999),
    ],
    kinds,
    "2026-10-01",
  );
  // Only August and September exist before October: a two-month average.
  assert.deepEqual(trends, [
    { categoryId: "food", current: 500, average: 450, months: 2 },
  ]);
});

test("classifyMerchants maps answers back to merchants and never marks money in deductible", async () => {
  let prompt = "";
  const model = new MockLanguageModelV4({
    doGenerate: async (options) => {
      prompt = JSON.stringify(options.prompt);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              results: [
                {
                  id: 0,
                  category: "Software",
                  deductible: true,
                  confidence: 0.95,
                },
                {
                  id: 1,
                  category: "Software",
                  deductible: true,
                  confidence: 0.5,
                },
                {
                  id: 7,
                  category: "Software",
                  deductible: false,
                  confidence: 1,
                },
              ],
            }),
          },
        ],
        finishReason: { unified: "stop", raw: undefined },
        usage: {
          inputTokens: {
            total: 1,
            noCache: 1,
            cacheRead: undefined,
            cacheWrite: undefined,
          },
          outputTokens: { total: 1, text: 1, reasoning: undefined },
        },
        warnings: [],
      };
    },
  });
  const results = await classifyMerchants(
    [
      {
        description: "GITHUB INC 1234567 US",
        type: "DEBIT",
        transactionType: "CardPurchases",
        amountMinor: 7_000,
        count: 1,
      },
      {
        description: "VERCEL REFUND",
        type: "CREDIT",
        transactionType: "Deposits",
        amountMinor: 2_000,
        count: 1,
      },
    ],
    {
      categories: [{ name: "Software", kind: "spending", description: "SaaS" }],
      rules: [{ pattern: "FIGMA", category: "Software", deductible: true }],
      notes: ["Vercel is always business."],
    },
    model,
  );
  assert.deepEqual(results.get("GITHUB INC"), {
    category: "Software",
    deductible: true,
    confidence: 0.95,
  });
  assert.equal(results.get("VERCEL REFUND")?.deductible, false);
  assert.equal(results.size, 2);
  // Memory reaches the model.
  assert.match(prompt, /FIGMA → Software \(deductible\)/);
  assert.match(prompt, /Vercel is always business\./);
});
