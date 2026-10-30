import assert from "node:assert/strict";
import { test } from "node:test";
import {
  findSubscriptions,
  type SubscriptionState,
  subscriptionAlerts,
  subscriptionTotals,
} from "../lib/expenses/subscriptions.ts";
import type { Transaction } from "../lib/expenses/transactions.ts";

let n = 0;
const charge = (
  description: string,
  date: string,
  amountMinor: number,
  type: Transaction["type"] = "DEBIT",
): Transaction => ({
  id: `tx${n++}`,
  accountId: "a",
  date,
  postingDate: date,
  type,
  transactionType: "CardPurchases",
  description,
  amountMinor,
});
const window = { from: "2026-05-01", today: "2026-10-30" };

test("finds a monthly charge and skips irregular ones", () => {
  const found = findSubscriptions(
    [
      charge("NETFLIX.COM 4029357733 NL", "2026-06-05", 19_900),
      charge("NETFLIX.COM 4029357733 NL", "2026-07-05", 19_900),
      charge("NETFLIX.COM 4029357733 NL", "2026-08-05", 19_900),
      charge("NETFLIX.COM 4029357733 NL", "2026-09-05", 19_900),
      charge("NETFLIX.COM 4029357733 NL", "2026-10-05", 19_900),
      // A coffee shop: several a month.
      charge("BOOTLEGGER CAPE TOWN ZA", "2026-10-01", 4_500),
      charge("BOOTLEGGER CAPE TOWN ZA", "2026-10-03", 4_200),
      charge("BOOTLEGGER CAPE TOWN ZA", "2026-10-09", 4_800),
      // Monthly-ish but only twice.
      charge("SPOTIFY ZA", "2026-09-10", 7_999),
      charge("SPOTIFY ZA", "2026-10-10", 7_999),
      // Money in is never a subscription.
      charge("SALARY", "2026-08-25", 1_000_000, "CREDIT"),
      charge("SALARY", "2026-09-25", 1_000_000, "CREDIT"),
      charge("SALARY", "2026-10-25", 1_000_000, "CREDIT"),
    ],
    window,
  );
  assert.equal(found.length, 1);
  const [netflix] = found;
  assert.equal(netflix.key, "NETFLIX.COM");
  assert.equal(netflix.charges, 5);
  assert.equal(netflix.nextDate, "2026-11-05");
  assert.equal(netflix.isNew, false);
  assert.equal(netflix.stopped, false);
  assert.equal(netflix.priceRise, false);
});

test("flags a price rise, a new one and a stopped one", () => {
  const found = findSubscriptions(
    [
      charge("CLAUDE.AI", "2026-07-20", 36_000),
      charge("CLAUDE.AI", "2026-08-20", 36_000),
      charge("CLAUDE.AI", "2026-09-20", 39_000),
      charge("GYM", "2026-08-12", 50_000),
      charge("GYM", "2026-09-12", 50_000),
      charge("GYM", "2026-10-12", 50_000),
      charge("SHOWMAX", "2026-05-03", 9_900),
      charge("SHOWMAX", "2026-06-03", 9_900),
      charge("SHOWMAX", "2026-07-03", 9_900),
    ],
    window,
  );
  // History that starts late doesn't make everything new.
  const late = findSubscriptions(
    ["2026-08-12", "2026-09-12", "2026-10-12"].map((d) =>
      charge("GYM", d, 50_000),
    ),
    window,
  );
  assert.equal(late[0].isNew, false);
  const by = new Map(found.map((s) => [s.key, s]));
  assert.equal(by.get("CLAUDE.AI")?.priceRise, true);
  assert.equal(by.get("GYM")?.isNew, true);
  assert.equal(by.get("SHOWMAX")?.stopped, true);
  // Stopped ones don't count towards the cost.
  assert.deepEqual(subscriptionTotals(found), {
    monthlyMinor: 89_000,
    yearlyMinor: 1_068_000,
  });
});

test("one merchant with two subscriptions keeps them apart", () => {
  const found = findSubscriptions(
    ["2026-07-01", "2026-08-01", "2026-09-01", "2026-10-01"].flatMap((d) => [
      charge("GOOGLE", d, 4_999),
      charge("GOOGLE", d, 21_999),
    ]),
    window,
  );
  assert.deepEqual(found.map((s) => s.key).sort(), [
    "GOOGLE ~R220",
    "GOOGLE ~R50",
  ]);
});

test("alerts: quiet first run, then new, price rises and charges after cancelling", () => {
  const [netflix] = findSubscriptions(
    ["2026-08-05", "2026-09-05", "2026-10-05"].map((d) =>
      charge("NETFLIX", d, 19_900),
    ),
    window,
  );
  const first = subscriptionAlerts([netflix], []);
  assert.equal(first.alerts.length, 0);
  assert.equal(first.upserts.length, 1);

  const other: SubscriptionState = {
    key: "OTHER",
    status: "tracking",
    notifiedMinor: 100,
    cancelledOn: null,
    alertedChargeOn: null,
  };
  assert.equal(subscriptionAlerts([netflix], [other]).alerts[0].kind, "new");

  const tracking = { ...first.upserts[0], notifiedMinor: 15_900 };
  const price = subscriptionAlerts([netflix], [tracking]);
  assert.deepEqual(
    price.alerts.map((a) => a.kind),
    ["price"],
  );
  assert.equal(price.upserts[0].notifiedMinor, 19_900);
  // Told once: the stored amount now matches.
  assert.equal(subscriptionAlerts([netflix], price.upserts).alerts.length, 0);

  const cancelled: SubscriptionState = {
    ...tracking,
    status: "cancelled",
    cancelledOn: "2026-09-20",
  };
  const after = subscriptionAlerts([netflix], [cancelled]);
  assert.deepEqual(
    after.alerts.map((a) => a.kind),
    ["after-cancel"],
  );
  assert.equal(subscriptionAlerts([netflix], after.upserts).alerts.length, 0);
  assert.equal(
    subscriptionAlerts([netflix], [{ ...cancelled, status: "ignored" }]).alerts
      .length,
    0,
  );
});
