import "server-only";
import { inArray, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { briefingNotes } from "@/db/schema";
import { getAttention } from "@/lib/attention";
import { briefingMessage } from "@/lib/briefing-message";
import { addDays, todayISO } from "@/lib/documents";
import { currentHealth } from "@/lib/health-log";
import { asOwner } from "@/lib/session";
import { appUrl, sendTelegram } from "@/lib/telegram";

// The morning briefing (app/api/cron/briefing, 07:00 Cape Town): one
// Telegram message with the weigh-in prompt, the dashboard's "Needs you"
// list and whatever the night's jobs queued here. The text is built in
// lib/briefing-message.ts; jobs queue their notes with lib/briefing-notes.ts.

/** Builds and sends the briefing. Returns whether anything was sent. */
export async function sendBriefing() {
  const today = todayISO();
  const [health, attention, notes] = await Promise.all([
    currentHealth(),
    // The cron proved itself with CRON_SECRET; the readers want a session.
    asOwner(() => getAttention()),
    db
      .select({ id: briefingNotes.id, text: briefingNotes.text })
      .from(briefingNotes)
      .where(isNull(briefingNotes.sentAt))
      .orderBy(briefingNotes.at),
  ]);
  const message = briefingMessage({
    today,
    weighedToday: health.today.weightGrams !== null,
    items: attention.items,
    notes: notes.map((n) => n.text),
    url: appUrl("/"),
  });
  if (attention.failed.length && message) {
    message.lines?.push(
      `\n(Couldn't check ${attention.failed.join(", ").toLowerCase()}.)`,
    );
  }
  const sent = message ? await sendTelegram(message) : false;
  // Only marked once Telegram took them, so a failed send keeps them for
  // tomorrow. Sent notes older than a month are pruned.
  if (sent && notes.length) {
    await db
      .update(briefingNotes)
      .set({ sentAt: new Date() })
      .where(
        inArray(
          briefingNotes.id,
          notes.map((n) => n.id),
        ),
      );
  }
  await db
    .delete(briefingNotes)
    .where(lt(briefingNotes.at, new Date(`${addDays(today, -30)}T00:00:00Z`)));
  return { sent, items: attention.items.length, notes: notes.length };
}
