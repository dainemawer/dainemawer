import assert from "node:assert/strict";
import { test } from "node:test";
import {
  type AttentionItem,
  type DocumentInput,
  documentItems,
  expenseReviewItems,
  healthItems,
  postItems,
  sortAttention,
} from "../lib/attention-items.ts";

const TODAY = "2026-11-02";

const doc = (extra: Partial<DocumentInput>): DocumentInput => ({
  id: "d1",
  kind: "invoice",
  number: "INV-2026-0001",
  company: "Acme",
  status: "sent",
  currency: "ZAR",
  totalMinor: 100_000,
  paidMinor: 0,
  dueDate: null,
  validUntil: null,
  recurringId: null,
  ...extra,
});

test("overdue invoices come one each, oldest first, with the balance", () => {
  const items = documentItems(
    [
      doc({
        id: "a",
        number: "INV-2",
        status: "overdue",
        dueDate: "2026-10-30",
      }),
      doc({
        id: "b",
        number: "INV-1",
        status: "overdue",
        dueDate: "2026-10-21",
        paidMinor: 40_000,
      }),
      doc({ id: "c", status: "sent", dueDate: "2026-11-30" }),
    ],
    TODAY,
  );
  assert.deepEqual(
    items.map((i) => i.title),
    ["INV-1 is 12 days overdue", "INV-2 is 3 days overdue"],
  );
  assert.equal(items[0].urgency, "urgent");
  assert.equal(items[0].href, "/invoices/b");
  assert.match(items[0].detail ?? "", /600\.00/);
});

test("one day overdue is singular", () => {
  const [item] = documentItems(
    [doc({ status: "overdue", dueDate: "2026-11-01" })],
    TODAY,
  );
  assert.equal(item.title, "INV-2026-0001 is 1 day overdue");
});

test("drafts are one line, linking to the draft or the filtered list", () => {
  const [one] = documentItems(
    [doc({ id: "x", status: "draft", recurringId: "r" })],
    TODAY,
  );
  assert.equal(one.title, "1 draft invoice to send");
  assert.equal(one.href, "/invoices/x");
  assert.match(one.detail ?? "", /recurring/);

  const [many] = documentItems(
    [
      doc({ id: "x", status: "draft", recurringId: "r" }),
      doc({ id: "y", status: "draft" }),
    ],
    TODAY,
  );
  assert.equal(many.title, "2 draft invoices to send");
  assert.equal(many.href, "/invoices?status=draft");
  assert.equal(many.detail, "1 from recurring schedules");
});

test("expired quotes are low priority; draft quotes aren't listed", () => {
  const items = documentItems(
    [
      doc({ id: "q", kind: "quote", number: "Q-1", status: "expired" }),
      doc({ id: "q2", kind: "quote", status: "draft" }),
    ],
    TODAY,
  );
  assert.equal(items.length, 1);
  assert.equal(items[0].urgency, "low");
  assert.equal(items[0].href, "/quotes/q");
});

test("nothing waiting, nothing listed", () => {
  assert.deepEqual(documentItems([doc({ status: "paid" })], TODAY), []);
  assert.deepEqual(expenseReviewItems(0), []);
  assert.deepEqual(postItems([]), []);
});

test("posts, expense review and health", () => {
  const [post] = postItems([
    { number: 135, title: "feat: x", posts: [{ slug: "expo-ota" }] },
  ]);
  assert.equal(post.href, "/reviews/135");
  assert.equal(post.detail, "#135 · expo-ota");
  assert.equal(expenseReviewItems(3)[0].title, "3 transactions to label");
  assert.equal(expenseReviewItems(1)[0].title, "1 transaction to label");
  assert.deepEqual(healthItems({ started: false, weighedToday: false }), []);
  assert.deepEqual(healthItems({ started: true, weighedToday: true }), []);
  assert.equal(
    healthItems({ started: true, weighedToday: false })[0].title,
    "No weigh-in today",
  );
});

test("sortAttention puts urgent first and keeps source order within a level", () => {
  const item = (id: string, urgency: AttentionItem["urgency"]) => ({
    id,
    urgency,
    title: id,
    href: "/",
  });
  const sorted = sortAttention([
    item("low1", "low"),
    item("n1", "normal"),
    item("u1", "urgent"),
    item("n2", "normal"),
    item("u2", "urgent"),
  ]);
  assert.deepEqual(
    sorted.map((i) => i.id),
    ["u1", "u2", "n1", "n2", "low1"],
  );
});
