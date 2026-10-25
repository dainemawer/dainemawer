import { z } from "zod";
import { parseMoney } from "@/lib/money";
import { computeTotals, parseQuantity, parseTaxRate } from "@/lib/totals";

// Schema pieces shared by the invoice/quote and recurring-invoice actions.
// Not in those "use server" files: everything they export becomes a public
// Server Action.

export const isoDate = z.iso.date("Pick a date.");
export const optionalDate = z
  .string()
  .transform((value) => value || null)
  .pipe(isoDate.nullable());
export const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);

function parsed<T>(parse: (value: string) => T | null, message: string) {
  return z.string().transform((value, ctx) => {
    const result = parse(value.trim() === "" ? "0" : value);
    if (result === null) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return result;
  });
}

export const lineSchema = z.object({
  description: z.string().trim().min(1, "Describe this line."),
  quantity: parsed(parseQuantity, "A number, up to two decimals."),
  unitPrice: parsed(parseMoney, "An amount, e.g. 1500 or 1500.50."),
});

/** Lines, discount and tax: the money part of an invoice or a schedule. */
export const pricingShape = {
  discount: parsed(parseMoney, "An amount, e.g. 500."),
  taxRate: parsed(parseTaxRate, "A percentage from 0 to 100."),
  lines: z.array(lineSchema).min(1, "Add at least one line item."),
};

type Pricing = {
  discount: number;
  taxRate: number;
  lines: z.output<typeof lineSchema>[];
};

export function totalsOf(doc: Pricing) {
  return computeTotals(
    doc.lines.map((line) => ({
      quantityHundredths: line.quantity,
      unitPriceMinor: line.unitPrice,
    })),
    doc.discount,
    doc.taxRate,
  );
}

/** superRefine step: no negative discount, and no total below zero. */
export function checkPricing(doc: Pricing, ctx: z.RefinementCtx) {
  if (doc.discount < 0) {
    ctx.addIssue({
      code: "custom",
      path: ["discount"],
      message: "A discount can't be negative.",
    });
  }
  // Negative lines are allowed (credits), a negative document isn't.
  if (totalsOf(doc).totalMinor < 0) {
    ctx.addIssue({
      code: "custom",
      path: ["discount"],
      message: "The total can't be below zero.",
    });
  }
}
