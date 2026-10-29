import assert from "node:assert/strict";
import { test } from "node:test";
import { type LinearIssue, linearToday } from "../lib/linear-today.ts";

const TODAY = "2026-10-29";

const issue = (
  identifier: string,
  state: LinearIssue["state"]["type"],
  extra: Partial<LinearIssue> = {},
): LinearIssue => ({
  identifier,
  title: `Issue ${identifier}`,
  url: `https://linear.app/x/issue/${identifier}`,
  priority: 0,
  dueDate: null,
  completedAt: null,
  state: { type: state },
  project: { name: "Shop" },
  ...extra,
});

test("linearToday orders late, due, in progress, then urgent and high to-dos", () => {
  const today = linearToday(
    [
      issue("A-5", "unstarted", { priority: 2 }),
      issue("A-4", "unstarted", { priority: 1 }),
      issue("A-3", "started"),
      issue("A-2", "unstarted", { dueDate: TODAY }),
      issue("A-1", "started", { dueDate: "2026-10-27" }),
      issue("A-6", "unstarted", { priority: 3 }),
      issue("A-7", "unstarted"),
    ],
    TODAY,
  );
  assert.deepEqual(
    today.items.map((i) => [i.identifier, i.reason]),
    [
      ["A-1", "overdue"],
      ["A-2", "due"],
      ["A-3", "started"],
      ["A-4", "urgent"],
      ["A-5", "high"],
    ],
  );
  assert.equal(today.inProgress, 2);
  assert.equal(today.overdue, 1);
  assert.equal(today.dueToday, 1);
});

test("linearToday counts what's done and never lists it", () => {
  const today = linearToday(
    [
      issue("A-1", "completed", {
        dueDate: "2026-10-27",
        completedAt: `${TODAY}T06:00:00Z`,
      }),
      issue("A-2", "completed", {
        priority: 1,
        completedAt: `${TODAY}T07:00:00Z`,
      }),
      issue("A-3", "canceled", { dueDate: "2026-10-20" }),
    ],
    TODAY,
  );
  assert.equal(today.doneToday, 2);
  assert.equal(today.overdue, 0);
  assert.deepEqual(today.items, []);
});

test("linearToday shows backlog only when it's due", () => {
  const today = linearToday(
    [
      issue("A-1", "backlog", { priority: 1 }),
      issue("A-2", "backlog", { dueDate: "2026-10-28" }),
    ],
    TODAY,
  );
  assert.deepEqual(
    today.items.map((i) => i.identifier),
    ["A-2"],
  );
});
