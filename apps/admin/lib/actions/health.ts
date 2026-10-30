"use server";

import { sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { healthDays } from "@/db/schema";
import { TAG } from "@/lib/cache-tags";
import { todayISO } from "@/lib/documents";
import { editableDay, parseNumber } from "@/lib/health";
import { requireSession } from "@/lib/session";
import type { FormState } from "./form-state";

const ticksSchema = z
  .object({
    proteinMeals: z.number().int().min(0).max(3).nullable(),
    kitchenClosed: z.boolean().nullable(),
    workedOut: z.boolean().nullable(),
  })
  .partial();

export type HealthTicks = z.infer<typeof ticksSchema>;

/** Ticks one of the day's habits (or clears it with null). */
export async function setHealthTicks(
  date: string,
  ticks: HealthTicks,
): Promise<{ error?: string }> {
  await requireSession();
  if (!editableDay(date, todayISO())) {
    return { error: "Only this past week can be changed." };
  }
  const parsed = ticksSchema.safeParse(ticks);
  if (!parsed.success || !Object.keys(parsed.data).length) {
    return { error: "Nothing to save." };
  }
  await upsert(date, parsed.data);
  return {};
}

/** A weigh-in typed in by hand, for a scale that isn't in Apple Health. */
export async function logWeight(
  date: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();
  if (!editableDay(date, todayISO())) {
    return { error: "Only this past week can be changed." };
  }
  const kg = parseNumber(formData.get("weight"));
  if (kg === null || kg < 30 || kg > 250) {
    return { fieldErrors: { weight: ["Your weight in kg, like 87.4."] } };
  }
  await upsert(date, { weightGrams: Math.round(kg * 1000) });
  return { ok: true };
}

async function upsert(
  date: string,
  values: HealthTicks & { weightGrams?: number },
) {
  await db
    .insert(healthDays)
    .values({ date, ...values })
    .onConflictDoUpdate({
      target: healthDays.date,
      set: { ...values, updatedAt: sql`now()` },
    });
  updateTag(TAG.health);
}
