import { generateText, type LanguageModel, Output } from "ai";
import { z } from "zod";
import { offlineClassify, offlineProposal } from "@/lib/expenses/offline";
import {
  CATEGORY_KINDS,
  type CategoryKind,
  merchantKey,
} from "@/lib/expenses/transactions";

// Claude through Vercel's AI Gateway: on Vercel it authenticates with the
// deployment's OIDC token, so there's no key to manage. Elsewhere it needs
// AI_GATEWAY_API_KEY; without one (local dev) the offline keyword matcher in
// lib/expenses/offline.ts stands in, so the whole flow still runs.
//
// Only what classifying needs leaves the app: a merchant description, its
// direction, Investec's transaction type and an example amount. Never
// account numbers or balances.

/** Sorting is a high-volume, simple task: the small model. */
const CLASSIFY_MODEL = "anthropic/claude-haiku-5.5";
/** Designing the category list happens once and shapes everything after: the bigger one. */
const PROPOSE_MODEL = "anthropic/claude-sonnet-5.5";

const BATCH = 60;

/** Below this the label is kept but goes to Review. */
export const REVIEW_THRESHOLD = 0.75;

export function aiConfigured() {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL);
}

const CONTEXT = `The account holder lives in South Africa and is a self-employed (sole proprietor) software engineer who pays some business costs from this personal account. A business expense is deductible against their freelance income: software and SaaS subscriptions, hosting, domains, computer equipment, professional fees, work-related courses and books, a share of home office costs, business travel. Groceries, eating out, personal entertainment and household costs are not.`;

export type Merchant = {
  description: string;
  type: "DEBIT" | "CREDIT";
  transactionType: string;
  /** A typical amount in minor units. */
  amountMinor: number;
  count: number;
};

export type ProposedCategory = {
  name: string;
  kind: CategoryKind;
  description: string;
};

export async function proposeCategories(
  merchants: Merchant[],
  model: LanguageModel | null = aiConfigured() ? PROPOSE_MODEL : null,
): Promise<ProposedCategory[]> {
  if (!model) return offlineProposal();
  const { output } = await generateText({
    model,
    output: Output.object({
      schema: z.object({
        categories: z
          .array(
            z.object({
              name: z.string().min(1).max(40),
              kind: z.enum(CATEGORY_KINDS),
              description: z.string().max(200),
            }),
          )
          .min(5)
          .max(25),
      }),
    }),
    system: `You design personal budgeting categories. ${CONTEXT}`,
    prompt: `Below are the merchants from the last few months of this person's bank account, most frequent first, with how often each appears and a typical amount in rands.

Propose 12 to 18 categories that would help them understand and improve their spending. Rules:
- Short, plain names ("Groceries", "Eating out", "Home loan").
- kind "spending" for money spent, "income" for money earned, "transfer" for money moved between their own accounts, savings, investments or credit card repayments (these must not count as spending).
- Include one "Business expenses" style category only if business costs appear; deductibility is tracked separately per transaction, so don't split categories by it.
- Each description says, in one sentence, what belongs in it, mentioning the merchants that do. It's what a classifier will read later.
- Every merchant below should clearly fit one category.

${merchants
  .map(
    (m) =>
      `${m.type === "DEBIT" ? "out" : "in"} · ${m.transactionType || "—"} · ${m.description} · ×${m.count} · ~R${Math.round(m.amountMinor / 100)}`,
  )
  .join("\n")}`,
  });
  // Names must be unique: they're how the classifier refers to categories.
  const seen = new Set<string>();
  return output.categories.filter((category) => {
    const key = category.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export type ClassifyInput = {
  categories: {
    name: string;
    kind: CategoryKind;
    description: string | null;
  }[];
  /** Your rules, shown as examples of how you categorise. */
  rules: { pattern: string; category: string; deductible: boolean }[];
  notes: string[];
};

export type Classification = {
  category: string;
  deductible: boolean;
  confidence: number;
};

/**
 * One classification per merchant (keyed by merchantKey), so a merchant
 * that appears thirty times costs one answer. Merchants the model skips
 * are missing from the map and stay unlabelled until the next run.
 */
export async function classifyMerchants(
  merchants: Merchant[],
  input: ClassifyInput,
  model: LanguageModel | null = aiConfigured() ? CLASSIFY_MODEL : null,
): Promise<Map<string, Classification>> {
  const results = new Map<string, Classification>();
  if (!merchants.length || !input.categories.length) return results;
  if (!model) {
    for (const merchant of merchants) {
      results.set(
        merchantKey(merchant.description),
        offlineClassify(merchant, input.categories),
      );
    }
    return results;
  }

  const names = input.categories.map((c) => c.name) as [string, ...string[]];
  const system = `You categorise bank transactions for a personal budget. ${CONTEXT}

Categories (use these exact names):
${input.categories
  .map(
    (c) =>
      `- ${c.name} [${c.kind}]${c.description ? `: ${c.description}` : ""}`,
  )
  .join("\n")}
${
  input.rules.length
    ? `\nHow the account holder has categorised merchants before (follow the same reasoning for similar ones):\n${input.rules
        .slice(0, 100)
        .map(
          (r) =>
            `- ${r.pattern} → ${r.category}${r.deductible ? " (deductible)" : ""}`,
        )
        .join("\n")}\n`
    : ""
}${
  input.notes.length
    ? `\nNotes from the account holder (these override your own judgement):\n${input.notes.map((n) => `- ${n}`).join("\n")}\n`
    : ""
}
For each transaction give the category, whether it's a deductible business expense (only ever true for money out), and your confidence from 0 to 1. Be honest about confidence: an ambiguous merchant name, or one that could be personal or business, is below 0.75.`;

  for (let start = 0; start < merchants.length; start += BATCH) {
    const batch = merchants.slice(start, start + BATCH);
    const { output } = await generateText({
      model,
      output: Output.object({
        schema: z.object({
          results: z.array(
            z.object({
              id: z.number().int(),
              category: z.enum(names),
              deductible: z.boolean(),
              confidence: z.number().min(0).max(1),
            }),
          ),
        }),
      }),
      system,
      prompt: batch
        .map(
          (m, i) =>
            `${i} · ${m.type === "DEBIT" ? "out" : "in"} · ${m.transactionType || "—"} · ${m.description} · R${(m.amountMinor / 100).toFixed(2)}`,
        )
        .join("\n"),
    });
    for (const result of output.results) {
      const merchant = batch[result.id];
      if (!merchant) continue;
      results.set(merchantKey(merchant.description), {
        category: result.category,
        deductible: merchant.type === "DEBIT" && result.deductible,
        confidence: result.confidence,
      });
    }
  }
  return results;
}
