import "server-only";
import { asc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { healthDays } from "@/db/schema";
import { TAG } from "@/lib/cache-tags";
import { summarise } from "@/lib/health";
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
