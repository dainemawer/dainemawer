import "server-only";
import { and, desc, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { connection } from "next/server";
import { db } from "@/db";
import { auditEvents, passkey, session } from "@/db/schema";
import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/session";
import { telegramConfigured } from "@/lib/telegram";

/**
 * Everything the Security section shows. Never cached: a session you just
 * signed out, or a sign-in a minute ago, has to show up straight away.
 */
export async function getSecurityOverview() {
  const { user } = await requireSession();
  await connection();
  const current = await auth.api.getSession({ headers: await headers() });
  const [passkeys, sessions, events] = await Promise.all([
    db
      .select({
        id: passkey.id,
        name: passkey.name,
        createdAt: passkey.createdAt,
        backedUp: passkey.backedUp,
      })
      .from(passkey)
      .where(eq(passkey.userId, user.id))
      .orderBy(desc(passkey.createdAt)),
    db
      .select({
        id: session.id,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      })
      .from(session)
      .where(
        and(eq(session.userId, user.id), gt(session.expiresAt, new Date())),
      )
      .orderBy(desc(session.updatedAt)),
    db.select().from(auditEvents).orderBy(desc(auditEvents.at)).limit(50),
  ]);
  return {
    passkeys,
    sessions: sessions.map((s) => ({
      ...s,
      current: s.id === current?.session.id,
    })),
    events,
    recoveryOverride: process.env.ALLOW_EMAIL_SIGN_IN === "1",
    telegram: telegramConfigured(),
  };
}
