import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyDay, summarise } from "../lib/health.ts";
import {
  cravingHour,
  cravingReply,
  cravingWindow,
  parseHealthMessage,
  weeklyReview,
  weightReply,
} from "../lib/health-messages.ts";

test("parseHealthMessage reads short health logs", () => {
  assert.deepEqual(parseHealthMessage("88.2"), { kind: "weight", kg: 88.2 });
  assert.deepEqual(parseHealthMessage(" 88,2 kg "), {
    kind: "weight",
    kg: 88.2,
  });
  assert.deepEqual(parseHealthMessage("Weight 87"), { kind: "weight", kg: 87 });
  assert.equal(parseHealthMessage("12"), null);
  assert.deepEqual(parseHealthMessage("Craving"), {
    kind: "craving",
    level: null,
    note: null,
  });
  assert.deepEqual(parseHealthMessage("craving 4 work call"), {
    kind: "craving",
    level: 4,
    note: "work call",
  });
  assert.deepEqual(parseHealthMessage("craving 3/5"), {
    kind: "craving",
    level: 3,
    note: null,
  });
  assert.deepEqual(parseHealthMessage("craving chocolate"), {
    kind: "craving",
    level: null,
    note: "chocolate",
  });
  assert.deepEqual(parseHealthMessage("protein 2"), {
    kind: "protein",
    meals: 2,
  });
  assert.deepEqual(parseHealthMessage("Kitchen"), { kind: "kitchen" });
  assert.deepEqual(parseHealthMessage("hiit 20 min"), { kind: "moved" });
  assert.deepEqual(parseHealthMessage("moved"), { kind: "moved" });
  // Questions go to the assistant.
  assert.equal(parseHealthMessage("how's my weight going?"), null);
  assert.equal(parseHealthMessage("ran out of coffee"), null);
  assert.equal(parseHealthMessage("what did I invoice in 2026"), null);
  assert.equal(parseHealthMessage("protein 5"), null);
});

test("cravingHour is Cape Town time", () => {
  assert.equal(cravingHour(new Date("2026-11-03T14:30:00Z")), 16);
});

test("cravingWindow finds the repeating two hours", () => {
  const at = (iso: string) => ({ at: new Date(iso), level: null, note: null });
  assert.equal(
    cravingWindow([
      at("2026-11-03T14:10:00Z"),
      at("2026-11-04T15:40:00Z"),
      at("2026-11-05T19:00:00Z"),
    ]),
    "16:00–18:00",
  );
  assert.equal(cravingWindow([at("2026-11-03T14:10:00Z")]), null);
  assert.equal(cravingWindow([]), null);
});

test("the replies", () => {
  assert.match(cravingReply(0), /glass of water/);
  assert.doesNotMatch(cravingReply(1), /this week around this time/);
  assert.match(cravingReply(2), /That's 3 this week/);
  const summary = summarise(
    [{ ...emptyDay("2026-11-03"), weightGrams: 88000 }],
    "2026-11-03",
  );
  assert.equal(weightReply(88, summary), "88.0 kg logged. Trend 88.0 kg.");
  assert.match(weightReply(89, summary), /water and salt/);
});

test("weeklyReview suggests the weakest habit", () => {
  const days = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"].map(
    (date) => ({
      ...emptyDay(date),
      steps: 9000,
      proteinMeals: 3,
      kitchenClosed: true,
      workedOut: date !== "2026-11-05",
    }),
  );
  const strong = weeklyReview(summarise(days, "2026-11-05"), []);
  assert.equal(strong.title, "Your week");
  assert.match(strong.lines?.join("\n") ?? "", /Every habit held/);
  assert.match(strong.lines?.join("\n") ?? "", /No cravings logged/);

  const lateNights = days.map((d) => ({ ...d, kitchenClosed: false }));
  const review = weeklyReview(summarise(lateNights, "2026-11-05"), [
    { at: new Date("2026-11-03T19:00:00Z"), level: 4, note: null },
    { at: new Date("2026-11-04T19:30:00Z"), level: 3, note: null },
  ]);
  const text = review.lines?.join("\n") ?? "";
  assert.match(text, /kitchen 0\/4/);
  assert.match(text, /2 cravings logged, most between 20:00–22:00/);
  assert.match(text, /Brush your teeth/);
});
