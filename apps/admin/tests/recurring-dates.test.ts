import assert from "node:assert/strict";
import { test } from "node:test";
import { dueIssueDates, nextIssueDate } from "../lib/recurring-dates.ts";

test("nextIssueDate steps by the interval and keeps the anchor day", () => {
  assert.equal(nextIssueDate("2026-10-15", "monthly", 15), "2026-11-15");
  assert.equal(nextIssueDate("2026-11-15", "quarterly", 15), "2027-02-15");
  assert.equal(nextIssueDate("2026-10-15", "yearly", 15), "2027-10-15");
  assert.equal(nextIssueDate("2026-12-01", "monthly", 1), "2027-01-01");
});

test("nextIssueDate falls back to the month's last day, then recovers", () => {
  assert.equal(nextIssueDate("2027-01-31", "monthly", 31), "2027-02-28");
  assert.equal(nextIssueDate("2027-02-28", "monthly", 31), "2027-03-31");
  assert.equal(nextIssueDate("2028-01-31", "monthly", 31), "2028-02-29");
  assert.equal(nextIssueDate("2026-11-30", "quarterly", 30), "2027-02-28");
  assert.equal(nextIssueDate("2028-02-29", "yearly", 29), "2029-02-28");
});

test("dueIssueDates catches up on missed runs and respects the end date", () => {
  const schedule = {
    nextIssueDate: "2026-08-01",
    interval: "monthly" as const,
    anchorDay: 1,
    endDate: null,
  };
  assert.deepEqual(dueIssueDates(schedule, "2026-07-31"), []);
  assert.deepEqual(dueIssueDates(schedule, "2026-08-01"), ["2026-08-01"]);
  assert.deepEqual(dueIssueDates(schedule, "2026-10-25"), [
    "2026-08-01",
    "2026-09-01",
    "2026-10-01",
  ]);
  assert.deepEqual(
    dueIssueDates({ ...schedule, endDate: "2026-09-15" }, "2026-10-25"),
    ["2026-08-01", "2026-09-01"],
  );
});
