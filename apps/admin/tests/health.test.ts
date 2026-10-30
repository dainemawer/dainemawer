import assert from "node:assert/strict";
import { test } from "node:test";
import {
  emptyDay,
  formatKg,
  healthPayloadSchema,
  PLAN,
  parseNumber,
  planGoalDate,
  planStartKg,
  planTarget,
  projectedGoalDate,
  summarise,
  toReadings,
  weeklyChange,
  weekOf,
  weightTrend,
} from "../lib/health.ts";

test("parseNumber reads numbers in any locale", () => {
  assert.equal(parseNumber(88.2), 88.2);
  assert.equal(parseNumber("88,2"), 88.2);
  assert.equal(parseNumber("88.2 kg"), 88.2);
  assert.equal(parseNumber("8,412"), 8412);
  assert.equal(parseNumber("8 412"), 8412);
  assert.equal(parseNumber("8 412"), 8412);
  assert.equal(parseNumber("1.234,5"), 1234.5);
  assert.equal(parseNumber("1,234.5"), 1234.5);
  assert.equal(parseNumber("7,25"), 7.25);
  assert.equal(parseNumber(""), null);
  assert.equal(parseNumber("n/a"), null);
  assert.equal(parseNumber(null), null);
  assert.equal(parseNumber(Number.NaN), null);
});

test("the payload takes one day or a list, and stores grams and minutes", () => {
  const one = healthPayloadSchema.parse({
    weightKg: "88,4",
    steps: 9120,
    sleepHours: "7,5",
  });
  assert.equal(one.days.length, 1);
  assert.deepEqual(toReadings(one.days[0]), {
    weightGrams: 88400,
    steps: 9120,
    sleepMinutes: 450,
    restingHr: null,
  });
  const many = healthPayloadSchema.parse({
    days: [{ date: "2026-11-01", weightKg: 88 }, { date: "2026-11-02" }],
  });
  assert.equal(many.days.length, 2);
  assert.equal(healthPayloadSchema.safeParse({ weightKg: 900 }).success, false);
  assert.equal(
    healthPayloadSchema.safeParse({ date: "yesterday", steps: 1 }).success,
    false,
  );
});

test("weightTrend smooths weigh-ins and carries over gaps", () => {
  const points = weightTrend(
    [
      { date: "2026-11-03", kg: 87 },
      { date: "2026-11-01", kg: 88 },
    ],
    "2026-11-04",
  );
  assert.deepEqual(
    points.map((p) => p.date),
    ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"],
  );
  assert.equal(points[0].trend, 88);
  assert.equal(points[1].kg, null);
  assert.equal(points[1].trend, 88);
  assert.ok(Math.abs(points[2].trend - 87.9) < 1e-9);
  assert.equal(points[3].trend, points[2].trend);
  assert.deepEqual(weightTrend([], "2026-11-04"), []);
});

test("weeklyChange compares the trend with a week ago", () => {
  const weighIns = Array.from({ length: 21 }, (_, i) => ({
    date: `2026-11-${String(i + 1).padStart(2, "0")}`,
    kg: 88 - i * 0.1,
  }));
  const points = weightTrend(weighIns, "2026-11-21");
  const change = weeklyChange(points);
  assert.ok(change !== null && change < -0.4 && change > -0.7);
  assert.equal(weeklyChange(points.slice(0, 7)), null);
});

test("the plan line runs from the start weight to the goal", () => {
  assert.equal(planTarget(88, PLAN.start), 88);
  assert.equal(planTarget(88, "2026-10-30"), 88);
  assert.equal(planTarget(88, "2026-11-09"), 87.5);
  assert.equal(planTarget(88, "2027-06-01"), PLAN.goalKg);
  // 3 kg at 0.5 kg a week: six weeks.
  assert.equal(planGoalDate(88), "2026-12-14");
});

test("projectedGoalDate follows the current pace", () => {
  assert.equal(projectedGoalDate("2026-11-20", 87, -0.5), "2026-12-18");
  assert.equal(projectedGoalDate("2026-11-20", 87, 0.1), null);
  assert.equal(projectedGoalDate("2026-11-20", 87, null), null);
  assert.equal(projectedGoalDate("2026-11-20", 84.9, null), "2026-11-20");
  assert.equal(projectedGoalDate("2026-11-20", 87, -0.01), null);
});

test("planStartKg starts from the trend on the plan's first day", () => {
  const before = weightTrend([{ date: "2026-10-30", kg: 88 }], "2026-10-31");
  assert.equal(planStartKg(before), 88);
  const spanning = weightTrend(
    [
      { date: "2026-10-31", kg: 88 },
      { date: "2026-11-02", kg: 87 },
    ],
    "2026-11-05",
  );
  assert.ok(Math.abs((planStartKg(spanning) ?? 0) - 87.9) < 1e-9);
  const later = weightTrend([{ date: "2026-11-04", kg: 87.5 }], "2026-11-06");
  assert.equal(planStartKg(later), 87.5);
  assert.equal(planStartKg([]), null);
});

test("summarise fills the week and the last fortnight", () => {
  const summary = summarise(
    [
      {
        ...emptyDay("2026-11-03"),
        weightGrams: 88000,
        steps: 9000,
        workedOut: true,
      },
      { ...emptyDay("2026-11-05"), weightGrams: 87600, workedOut: true },
    ],
    "2026-11-05",
  );
  assert.deepEqual(
    summary.week.map((d) => d.date),
    weekOf("2026-11-05"),
  );
  assert.equal(summary.week[0].date, "2026-11-02");
  assert.equal(summary.workoutsThisWeek, 2);
  assert.equal(summary.recent.length, 14);
  assert.equal(summary.recent[0].date, "2026-11-05");
  assert.equal(summary.scaleKg, 87.6);
  assert.equal(summary.startKg, 88);
  assert.equal(summary.connected, true);
  assert.equal(summarise([], "2026-11-05").trendKg, null);
});

test("formatKg", () => {
  assert.equal(formatKg(87.64), "87.6 kg");
  assert.equal(formatKg(-0.42, { signed: true }), "−0.4 kg");
  assert.equal(formatKg(0.3, { signed: true }), "+0.3 kg");
  assert.equal(formatKg(-0.01, { signed: true }), "0.0 kg");
});
