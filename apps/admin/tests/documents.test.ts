import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDays,
  allowedActions,
  displayStatus,
  formatDocumentNumber,
  statusTargets,
  todayISO,
} from "../lib/documents.ts";

test("formatDocumentNumber pads to four digits", () => {
  assert.equal(formatDocumentNumber("quote", 2026, 1), "Q-2026-0001");
  assert.equal(formatDocumentNumber("invoice", 2026, 12345), "INV-2026-12345");
});

test("displayStatus derives expired and overdue from dates", () => {
  const today = "2026-10-23";
  const quote = { kind: "quote" as const, dueDate: null };
  const invoice = { kind: "invoice" as const, validUntil: null };
  assert.equal(
    displayStatus(
      { ...quote, status: "sent", validUntil: "2026-10-22" },
      today,
    ),
    "expired",
  );
  assert.equal(
    displayStatus(
      { ...quote, status: "sent", validUntil: "2026-10-23" },
      today,
    ),
    "sent",
  );
  assert.equal(
    displayStatus(
      { ...quote, status: "accepted", validUntil: "2026-01-01" },
      today,
    ),
    "accepted",
  );
  assert.equal(
    displayStatus({ ...invoice, status: "sent", dueDate: "2026-10-22" }, today),
    "overdue",
  );
  assert.equal(
    displayStatus({ ...invoice, status: "paid", dueDate: "2026-01-01" }, today),
    "paid",
  );
  assert.equal(
    displayStatus(
      { ...invoice, status: "draft", dueDate: "2026-01-01" },
      today,
    ),
    "draft",
  );
});

test("allowedActions follows the lifecycle", () => {
  assert.equal(allowedActions("quote", "accepted").convert, true);
  assert.equal(allowedActions("quote", "sent").convert, true);
  assert.equal(allowedActions("quote", "draft").convert, true);
  assert.equal(allowedActions("quote", "declined").convert, false);
  assert.equal(allowedActions("quote", "draft").accept, true);
  assert.equal(allowedActions("invoice", "draft").markPaid, true);
  assert.equal(allowedActions("invoice", "paid").markPaid, false);
  assert.equal(allowedActions("invoice", "sent").edit, true);
  assert.equal(allowedActions("invoice", "sent").markPaid, true);
  assert.equal(allowedActions("invoice", "paid").void, false);
  assert.equal(allowedActions("invoice", "sent").delete, false);
  assert.equal(allowedActions("invoice", "draft").delete, false);
  assert.equal(allowedActions("invoice", "draft").void, true);
  assert.equal(allowedActions("quote", "draft").delete, true);
  assert.equal(allowedActions("invoice", "draft").send, true);
  assert.equal(
    allowedActions("invoice", "draft", { recurring: true }).send,
    false,
  );
  assert.equal(
    allowedActions("invoice", "sent", { recurring: true }).send,
    false,
  );
  assert.equal(
    allowedActions("invoice", "draft", { recurring: true }).markSent,
    true,
  );
  assert.equal(allowedActions("invoice", "draft").markSent, false);
});

test("statusTargets offers every other status of the kind", () => {
  assert.deepEqual(statusTargets("quote", "draft"), [
    "sent",
    "accepted",
    "declined",
  ]);
  // Between paid and void, an invoice goes back to draft or sent first.
  assert.deepEqual(statusTargets("invoice", "void"), ["draft", "sent"]);
  assert.deepEqual(statusTargets("invoice", "paid"), ["draft", "sent"]);
});

test("todayISO uses Cape Town time", () => {
  // 23:30 UTC on the 22nd is 01:30 on the 23rd in Johannesburg.
  assert.equal(todayISO(new Date("2026-10-22T23:30:00Z")), "2026-10-23");
});

test("addDays crosses month and year ends", () => {
  assert.equal(addDays("2026-12-25", 30), "2027-01-24");
  assert.equal(addDays("2026-02-27", 2), "2026-03-01");
});
