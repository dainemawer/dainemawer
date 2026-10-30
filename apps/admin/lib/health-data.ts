import "server-only";
import { asc, gte } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { healthCravings, healthDays } from "@/db/schema";
import { TAG } from "@/lib/cache-tags";
import { wallToUtc } from "@/lib/calendar";
import { TIME_ZONE } from "@/lib/documents";
import { summarise, weekOf } from "@/lib/health";
import { requireSession } from "@/lib/session";
import { getToday } from "@/lib/today";

// Same shape as lib/dashboard.ts: the export checks the session, then
// reads cached rows. A year of days is a few hundred small rows, so it
// reads them all and lib/health.ts does the rest.

export async function getHealth() {
  await requireSession();
  const today = await getToday();
  return summarise(await healthRows(), today);
}

/** This week's cravings (logged through the bot), oldest first. */
export async function getCravingsThisWeek() {
  await requireSession();
  const [monday] = weekOf(await getToday());
  return cravingsSince(monday);
}

async function cravingsSince(monday: string) {
  "use cache: remote";
  cacheTag(TAG.health);
  cacheLife("hours");
  const [y, m, d] = monday.split("-").map(Number);
  return db
    .select({
      at: healthCravings.at,
      level: healthCravings.level,
      note: healthCravings.note,
    })
    .from(healthCravings)
    .where(gte(healthCravings.at, wallToUtc(y, m, d, 0, 0, 0, TIME_ZONE)))
    .orderBy(asc(healthCravings.at));
}

async function healthRows() {
  "use cache: remote";
  cacheTag(TAG.health);
  cacheLife("hours");
  return db
    .select({
      date: healthDays.date,
      weightGrams: healthDays.weightGrams,
      steps: healthDays.steps,
      sleepMinutes: healthDays.sleepMinutes,
      restingHr: healthDays.restingHr,
      proteinMeals: healthDays.proteinMeals,
      kitchenClosed: healthDays.kitchenClosed,
      workedOut: healthDays.workedOut,
    })
    .from(healthDays)
    .orderBy(asc(healthDays.date));
}
