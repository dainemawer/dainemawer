"use server";

import { AISDKError } from "ai";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import {
  expenseAccounts,
  expenseCategories,
  expenseLabels,
  expenseNotes,
  expenseRules,
  expenseSubscriptions,
} from "@/db/schema";
import { audit } from "@/lib/audit";
import { TAG } from "@/lib/cache-tags";
import { addDays, todayISO } from "@/lib/documents";
import { errorMessage } from "@/lib/errors";
import { type ProposedCategory, proposeCategories } from "@/lib/expenses/ai";
import { investecConfigured } from "@/lib/expenses/investec";
import {
  backfill,
  fetchIncluded,
  HISTORY_DAYS,
  merchantsOf,
  recomputeMonths,
  runRecon,
  syncAccounts,
} from "@/lib/expenses/recon";
import type { SubscriptionStatus } from "@/lib/expenses/subscriptions";
import {
  CATEGORY_KINDS,
  matchRule,
  merchantKey,
  monthOf,
  monthsBetween,
  postingDateFromId,
  type Transaction,
} from "@/lib/expenses/transactions";
import { requireSession } from "@/lib/session";

type ActionResult = { error?: string };

// AI Gateway's own errors (out of credits, model unavailable) say what to
// fix, so they're shown; anything else gets the action's generic message.
const failed = (error: unknown, fallback: string) => ({
  error: AISDKError.isInstance(error)
    ? `AI Gateway: ${error.message}`
    : errorMessage(error, fallback),
});

const categorySchema = z.object({
  name: z.string().trim().min(1, "Give it a name.").max(40),
  kind: z.enum(CATEGORY_KINDS),
  description: z
    .string()
    .trim()
    .max(200)
    .transform((value) => value || null),
});

/** Step one of setup: the AI reads your history and suggests categories. Nothing is saved. */
export async function suggestCategories(): Promise<
  ActionResult & { categories?: ProposedCategory[] }
> {
  await requireSession();
  if (!investecConfigured()) return { error: "Connect Investec first." };
  try {
    await syncAccounts();
    const today = todayISO();
    const transactions = await fetchIncluded(
      addDays(today, -HISTORY_DAYS),
      today,
    );
    if (!transactions.length) {
      return {
        error:
          "No transactions found on the included accounts. Check which accounts are included below.",
      };
    }
    updateTag(TAG.expenses);
    return {
      categories: await proposeCategories(
        merchantsOf(transactions).slice(0, 250),
      ),
    };
  } catch (error) {
    return failed(error, "Couldn't suggest categories.");
  }
}

/** Step two: save the approved list, then label the whole history. */
export async function createCategories(
  input: z.input<typeof categorySchema>[],
): Promise<ActionResult> {
  await requireSession();
  const result = z
    .array(categorySchema)
    .min(2, "Keep at least two categories.")
    .max(40)
    .safeParse(input);
  if (!result.success) return { error: result.error.issues[0].message };
  const names = result.data.map((c) => c.name.toLowerCase());
  if (new Set(names).size !== names.length) {
    return { error: "Two categories have the same name." };
  }
  try {
    await db
      .insert(expenseCategories)
      .values(result.data.map((c, position) => ({ ...c, position })))
      .onConflictDoNothing();
    await backfill();
  } catch (error) {
    return failed(error, "Couldn't finish setting up.");
  }
  updateTag(TAG.expenses);
  redirect("/expenses");
}

export async function saveCategory(
  input: z.input<typeof categorySchema> & { id?: string },
): Promise<ActionResult> {
  await requireSession();
  const result = categorySchema.safeParse(input);
  if (!result.success) return { error: result.error.issues[0].message };
  try {
    if (input.id) {
      await db
        .update(expenseCategories)
        .set(result.data)
        .where(eq(expenseCategories.id, input.id));
    } else {
      const existing = await db
        .select({ id: expenseCategories.id })
        .from(expenseCategories);
      await db
        .insert(expenseCategories)
        .values({ ...result.data, position: existing.length });
    }
  } catch {
    return { error: "A category with that name already exists." };
  }
  updateTag(TAG.expenses);
  return {};
}

/** Only categories nothing is labelled with can go; move their transactions first. */
export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireSession();
  const [used] = await db
    .select({ id: expenseLabels.transactionId })
    .from(expenseLabels)
    .where(eq(expenseLabels.categoryId, id))
    .limit(1);
  if (used) {
    return {
      error: "Transactions use this category. Move them to another one first.",
    };
  }
  await db.delete(expenseCategories).where(eq(expenseCategories.id, id));
  updateTag(TAG.expenses);
  return {};
}

const relabelSchema = z.object({
  transactionId: z.string().regex(/^\d{8,40}$/),
  accountId: z.string().min(1).max(40),
  description: z.string().max(200),
  categoryId: z.uuid(),
  deductible: z.boolean(),
  /** Set to also remember it: descriptions containing this get the same label. */
  remember: z.string().trim().max(60).optional(),
});

/**
 * Your label for one transaction. With `remember`, it becomes a rule and is
 * applied to every other transaction from that merchant in the history
 * window, except ones you've labelled yourself.
 */
export async function relabelTransaction(
  input: z.input<typeof relabelSchema>,
): Promise<ActionResult & { applied?: number }> {
  await requireSession();
  const result = relabelSchema.safeParse(input);
  if (!result.success) return { error: "That label isn't valid." };
  const label = result.data;
  const pattern = label.remember ? merchantKey(label.remember) : "";
  if (label.remember && !merchantKey(label.description).includes(pattern)) {
    return {
      error: `"${label.remember}" isn't part of this transaction's description, so the rule would never match it.`,
    };
  }
  const today = todayISO();
  const months = [monthOf(postingDateFromId(label.transactionId) ?? today)];
  let applied = 0;
  // Set when remembering a rule, which reads the whole history window anyway.
  let window: Transaction[] | undefined;
  try {
    await db
      .insert(expenseLabels)
      .values({
        transactionId: label.transactionId,
        accountId: label.accountId,
        categoryId: label.categoryId,
        deductible: label.deductible,
        source: "you",
        needsReview: false,
      })
      .onConflictDoUpdate({
        target: expenseLabels.transactionId,
        set: {
          categoryId: label.categoryId,
          deductible: label.deductible,
          source: "you",
          confidence: null,
          needsReview: false,
        },
      });

    if (pattern) {
      const [rule] = await db
        .insert(expenseRules)
        .values({
          pattern,
          categoryId: label.categoryId,
          deductible: label.deductible,
        })
        .onConflictDoUpdate({
          target: expenseRules.pattern,
          set: { categoryId: label.categoryId, deductible: label.deductible },
        })
        .returning();
      await audit("expense-rule-saved", `"${pattern}"`);
      const rules = await db.select().from(expenseRules);
      window = await fetchIncluded(addDays(today, -HISTORY_DAYS), today);
      const matches = window.filter(
        (tx) =>
          tx.id !== label.transactionId &&
          matchRule(tx.description, rules)?.id === rule.id,
      );
      if (matches.length) {
        const mine = new Set(
          (
            await db
              .select({ id: expenseLabels.transactionId })
              .from(expenseLabels)
              .where(
                and(
                  inArray(
                    expenseLabels.transactionId,
                    matches.map((tx) => tx.id),
                  ),
                  eq(expenseLabels.source, "you"),
                ),
              )
          ).map((row) => row.id),
        );
        const targets = matches.filter((tx) => !mine.has(tx.id));
        if (targets.length) {
          // One upsert for every match; `excluded` is each row's own values.
          await db
            .insert(expenseLabels)
            .values(
              targets.map((tx) => ({
                transactionId: tx.id,
                accountId: tx.accountId,
                categoryId: rule.categoryId,
                deductible: rule.deductible && tx.type === "DEBIT",
                source: "rule" as const,
                confidence: null,
                needsReview: false,
              })),
            )
            .onConflictDoUpdate({
              target: expenseLabels.transactionId,
              set: {
                categoryId: sql`excluded.category_id`,
                deductible: sql`excluded.deductible`,
                source: sql`excluded.source`,
                confidence: sql`excluded.confidence`,
                needsReview: sql`excluded.needs_review`,
              },
            });
          months.push(...targets.map((tx) => monthOf(tx.postingDate)));
        }
        applied = targets.length;
      }
    }
    await recomputeMonths(months, today, window);
  } catch (error) {
    return failed(error, "Couldn't save the label.");
  }
  updateTag(TAG.expenses);
  return { applied };
}

/** Accept the classifier's labels as they are. */
export async function confirmLabels(ids: string[]): Promise<ActionResult> {
  await requireSession();
  const result = z
    .array(z.string().regex(/^\d{8,40}$/))
    .max(500)
    .safeParse(ids);
  if (!result.success || !result.data.length) return {};
  await db
    .update(expenseLabels)
    .set({ needsReview: false })
    .where(inArray(expenseLabels.transactionId, result.data));
  updateTag(TAG.expenses);
  return {};
}

export async function saveNote(body: string): Promise<ActionResult> {
  await requireSession();
  const text = body.trim();
  if (!text) return { error: "Write the note first." };
  if (text.length > 500) return { error: "Keep notes under 500 characters." };
  await db.insert(expenseNotes).values({ body: text });
  updateTag(TAG.expenses);
  return {};
}

export async function deleteNote(id: string): Promise<ActionResult> {
  await requireSession();
  await db.delete(expenseNotes).where(eq(expenseNotes.id, id));
  updateTag(TAG.expenses);
  return {};
}

/**
 * What you say about a detected subscription: "ignored" (not one), or
 * "cancelled" (any later charge is flagged), or "tracking" to undo either.
 */
export async function setSubscriptionStatus(
  key: string,
  status: SubscriptionStatus,
): Promise<ActionResult> {
  await requireSession();
  const parsed = z
    .object({
      key: z.string().trim().min(1).max(200),
      status: z.enum(["tracking", "ignored", "cancelled"]),
    })
    .safeParse({ key, status });
  if (!parsed.success) return { error: "That isn't a valid change." };
  const cancelledOn = status === "cancelled" ? todayISO() : null;
  await db
    .insert(expenseSubscriptions)
    .values({ key: parsed.data.key, status, cancelledOn })
    .onConflictDoUpdate({
      target: expenseSubscriptions.key,
      set: { status, cancelledOn, alertedChargeOn: null },
    });
  updateTag(TAG.expenses);
  return {};
}

/** Labels it already made stay; it just stops applying to new transactions. */
export async function deleteRule(id: string): Promise<ActionResult> {
  await requireSession();
  const [rule] = await db
    .delete(expenseRules)
    .where(eq(expenseRules.id, id))
    .returning({ pattern: expenseRules.pattern });
  if (rule) await audit("expense-rule-deleted", `"${rule.pattern}"`);
  updateTag(TAG.expenses);
  return {};
}

export async function setAccountIncluded(
  accountId: string,
  included: boolean,
): Promise<ActionResult> {
  await requireSession();
  try {
    const [changed] = await db
      .update(expenseAccounts)
      .set({ included })
      .where(
        and(
          eq(expenseAccounts.accountId, accountId),
          ne(expenseAccounts.included, included),
        ),
      )
      .returning();
    if (changed) {
      await audit(
        "expense-account-changed",
        `${changed.name} ${included ? "included" : "excluded"}`,
      );
      const [category] = await db
        .select({ id: expenseCategories.id })
        .from(expenseCategories)
        .limit(1);
      // Once set up, the totals follow: a newly included account is labelled
      // back through the history window; an excluded one drops out of it.
      if (category && included) await backfill();
      else if (category) {
        const today = todayISO();
        await recomputeMonths(
          monthsBetween(addDays(today, -HISTORY_DAYS), today),
        );
      }
    }
  } catch (error) {
    return failed(error, "Couldn't update the account.");
  }
  updateTag(TAG.expenses);
  return {};
}

export async function refreshAccounts(): Promise<ActionResult> {
  await requireSession();
  try {
    await syncAccounts();
  } catch (error) {
    return failed(error, "Couldn't reach Investec.");
  }
  updateTag(TAG.expenses);
  return {};
}

/** The daily recon on demand, without the Telegram summary. */
export async function syncNow(): Promise<
  ActionResult & { labelled?: number; review?: number }
> {
  await requireSession();
  try {
    const result = await runRecon({ notify: false });
    if (result.skipped) return { error: result.skipped };
    updateTag(TAG.expenses);
    return { labelled: result.labelled, review: result.review };
  } catch (error) {
    return failed(error, "Couldn't sync with Investec.");
  }
}
