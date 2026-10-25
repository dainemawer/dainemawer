"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { TAG } from "@/lib/cache-tags";
import { CURRENCIES } from "@/lib/money";
import { requireSession } from "@/lib/session";
import { parseTaxRate } from "@/lib/totals";
import { type FormState, fieldErrorsFrom } from "./form-state";

const optional = z
  .string()
  .trim()
  .transform((value) => value || null);
const required = (label: string) =>
  z.string().trim().min(1, `${label} is required.`);
const days = z.coerce.number().int().min(0).max(365);

const settingsSchema = z.object({
  businessName: required("Business name"),
  address: optional,
  email: optional.pipe(z.email("Not a valid email address.").nullable()),
  phone: optional,
  website: optional,
  taxNumber: optional,
  bankDetails: optional,
  defaultCurrency: z.enum(CURRENCIES),
  defaultTermsDays: days,
  defaultTaxRateBp: z.string().transform((value, ctx) => {
    const bp = parseTaxRate(value || "0");
    if (bp === null) {
      ctx.addIssue({ code: "custom", message: "A percentage from 0 to 100." });
      return z.NEVER;
    }
    return bp;
  }),
  quoteValidityDays: days,
  quoteTerms: optional,
  invoiceTerms: optional,
  defaultNotes: optional,
  quoteEmailSubject: required("Subject"),
  quoteEmailBody: required("Message"),
  invoiceEmailSubject: required("Subject"),
  invoiceEmailBody: required("Message"),
});

export async function saveSettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }
  await db.update(settings).set(parsed.data).where(eq(settings.id, 1));
  updateTag(TAG.settings);
  return { ok: true };
}
