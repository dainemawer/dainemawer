import "server-only";
import { sql } from "drizzle-orm";
import type { Tx } from "@/db";
import { counters } from "@/db/schema";
import { type DocumentKind, formatDocumentNumber } from "@/lib/documents";

/**
 * Next number for (kind, year), allocated inside the caller's transaction:
 * the upsert takes a row lock, so concurrent creates queue rather than
 * collide, and a rolled-back create releases its number.
 */
export async function allocateNumber(
  tx: Tx,
  kind: DocumentKind,
  issueDate: string,
) {
  const year = Number(issueDate.slice(0, 4));
  const [row] = await tx
    .insert(counters)
    .values({ kind, year, lastValue: 1 })
    .onConflictDoUpdate({
      target: [counters.kind, counters.year],
      set: { lastValue: sql`${counters.lastValue} + 1` },
    })
    .returning({ value: counters.lastValue });
  return formatDocumentNumber(kind, year, row.value);
}
