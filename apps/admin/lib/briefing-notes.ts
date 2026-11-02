import "server-only";
import { db } from "@/db";
import { briefingNotes } from "@/db/schema";

// Kept apart from lib/briefing.ts, which reads every area: the jobs that
// queue notes (the expenses sync) are among the things it reads.

/**
 * Leaves a line for the next morning's briefing instead of sending a message now.
 * For news that can wait until 07:00; anything urgent still sends itself.
 * Never throws: a lost note mustn't fail the job that found it.
 */
export async function queueBriefingNote(text: string) {
  try {
    await db.insert(briefingNotes).values({ text });
  } catch (error) {
    console.error("[briefing] couldn't queue a note", error);
  }
}
