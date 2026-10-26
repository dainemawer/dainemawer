"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { documents, sends } from "@/db/schema";
import { ADMIN_EMAIL } from "@/lib/auth";
import { TAG } from "@/lib/cache-tags";
import { allowedActions } from "@/lib/documents";
import { errorMessage } from "@/lib/errors";
import { sendMail } from "@/lib/mail";
import { getDocument, getSettings } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { saveSnapshot } from "@/lib/snapshots";
import { pdfFilename, renderDocumentPdf } from "@/pdf/render";
import { type FormState, fieldErrorsFrom } from "./form-state";

const emails = (required: boolean) =>
  z
    .string()
    .transform((value) =>
      value
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    )
    .pipe(
      required
        ? z
            .array(z.email("One of these isn't a valid email address."))
            .min(1, "Add a recipient.")
        : z.array(z.email("One of these isn't a valid email address.")),
    );

const sendSchema = z.object({
  to: emails(true),
  cc: emails(false),
  subject: z.string().trim().min(1, "Add a subject."),
  body: z.string().trim().min(1, "Add a message."),
});

/**
 * Emails a quote or invoice with its PDF attached. Order matters: render,
 * snapshot, send, and only then record the send and move the status — so
 * a failed send leaves the document exactly as it was.
 */
export async function sendDocument(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();
  const parsed = sendSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }
  const full = await getDocument(id);
  if (!full) return { error: "Document not found." };
  const { document, customer, lines } = full;
  if (!allowedActions(document.kind, document.status).send) {
    return { error: `A ${document.status} ${document.kind} can't be sent.` };
  }

  const settings = await getSettings();
  const sendId = crypto.randomUUID();
  try {
    const pdf = await renderDocumentPdf({
      settings,
      customer,
      document,
      lines,
    });
    const filename = pdfFilename(document.number, customer.company);
    const pdfPathname = await saveSnapshot(
      `sends/${document.number}/${sendId}.pdf`,
      pdf,
    );
    const { id: resendId } = await sendMail({
      to: parsed.data.to,
      cc: parsed.data.cc,
      // A copy lands in your own inbox, next to the client's reply.
      bcc: [ADMIN_EMAIL],
      subject: parsed.data.subject,
      text: parsed.data.body,
      attachments: [{ filename, content: pdf }],
      idempotencyKey: `send-${sendId}`,
    });

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.insert(sends).values({
        id: sendId,
        documentId: id,
        ...parsed.data,
        pdfPathname,
        resendId,
        sentAt: now,
      });
      await tx
        .update(documents)
        .set({
          sentAt: now,
          // Accepted/paid stay as they are on a re-send; drafts become sent.
          ...(document.status === "draft" ? { status: "sent" as const } : {}),
        })
        .where(eq(documents.id, id));
    });
  } catch (error) {
    return {
      error: `Not sent: ${errorMessage(error, "something went wrong")}.`,
    };
  }

  updateTag(TAG.documents);
  return { ok: true };
}
