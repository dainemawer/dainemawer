"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { CURRENCIES } from "@/lib/money";
import { safeLocalPath } from "@/lib/safe-path";
import { requireSession } from "@/lib/session";
import { type FormState, fieldErrorsFrom } from "./form-state";

const optional = z
  .string()
  .trim()
  .transform((value) => value || null);

const emailList = z
  .string()
  .transform((value) =>
    value
      .split(/[\s,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
  .pipe(
    z
      .array(z.email("One of these isn't a valid email address."))
      .min(1, "Add at least one billing email."),
  );

const customerSchema = z.object({
  company: z.string().trim().min(1, "Company or client name is required."),
  contactName: optional,
  emails: emailList,
  ccEmail: optional.pipe(z.email("Not a valid email address.").nullable()),
  address: optional,
  taxNumber: optional,
  currency: z.enum(CURRENCIES),
  termsDays: z.coerce
    .number()
    .int()
    .min(0, "Can't be negative.")
    .max(365, "At most 365 days."),
  notes: optional,
});

export async function saveCustomer(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();
  const id = formData.get("id")?.toString() || null;
  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  let savedId = id;
  if (id) {
    await db.update(customers).set(parsed.data).where(eq(customers.id, id));
  } else {
    const [created] = await db
      .insert(customers)
      .values(parsed.data)
      .returning({ id: customers.id });
    savedId = created.id;
  }
  revalidatePath("/customers");
  // Back to where a new customer was started from, e.g. the quote form.
  const returnTo = safeLocalPath(formData.get("returnTo")?.toString());
  if (returnTo) {
    redirect(
      `${returnTo}${returnTo.includes("?") ? "&" : "?"}customer=${savedId}`,
    );
  }
  redirect(`/customers/${savedId}`);
}

export async function setCustomerArchived(id: string, archived: boolean) {
  await requireSession();
  await db
    .update(customers)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(customers.id, id));
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
}
