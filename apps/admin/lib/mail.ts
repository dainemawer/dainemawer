import "server-only";
import { Resend } from "resend";
import { UserError } from "@/lib/errors";

// Every email this app sends goes through here: magic links and documents.
// Without RESEND_API_KEY (local dev) nothing is sent and the message is
// logged instead, so the whole flow still works offline.

export const MAIL_FROM =
  process.env.MAIL_FROM ?? "Daine Mawer <billing@dainemawer.com>";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

type Mail = {
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  text: string;
  /** Optional HTML version; `text` is always sent alongside it. */
  html?: string;
  attachments?: { filename: string; content: Buffer }[];
  idempotencyKey?: string;
};

export async function sendMail(mail: Mail): Promise<{ id: string | null }> {
  if (!resend) {
    console.info(
      `[mail] RESEND_API_KEY not set — not sending.\nTo: ${mail.to.join(", ")}\nSubject: ${mail.subject}\n\n${mail.text}\n` +
        (mail.attachments?.length
          ? `(attachments: ${mail.attachments.map((a) => a.filename).join(", ")})`
          : ""),
    );
    return { id: null };
  }
  const { data, error } = await resend.emails.send(
    {
      from: MAIL_FROM,
      to: mail.to,
      cc: mail.cc?.length ? mail.cc : undefined,
      bcc: mail.bcc?.length ? mail.bcc : undefined,
      replyTo: mail.replyTo,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      attachments: mail.attachments,
    },
    mail.idempotencyKey ? { idempotencyKey: mail.idempotencyKey } : undefined,
  );
  // Resend's message says what to fix ("invalid to address").
  if (error) throw new UserError(`Resend: ${error.message}`);
  return { id: data?.id ?? null };
}
