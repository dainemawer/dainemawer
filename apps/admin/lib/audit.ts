import "server-only";
import { and, eq, gte } from "drizzle-orm";
import { headers as requestHeaders } from "next/headers";
import { db } from "@/db";
import { auditEvents } from "@/db/schema";
import {
  AUDIT_LABEL,
  AUDIT_TELEGRAM,
  type AuditAction,
} from "@/lib/audit-actions";
import { FAMILIAR_DAYS, familiarSignIn } from "@/lib/sign-in-alert";
import { appUrl, sendTelegram } from "@/lib/telegram";
import { describeDevice } from "@/lib/user-agent";

/** Where a request came from, as Vercel reports it. Empty fields outside Vercel. */
export function requestOrigin(headers: Headers | null | undefined) {
  const city = headers?.get("x-vercel-ip-city");
  const country = headers?.get("x-vercel-ip-country");
  return {
    ipAddress:
      headers?.get("x-forwarded-for")?.split(",")[0].trim() ||
      headers?.get("x-real-ip") ||
      null,
    userAgent: headers?.get("user-agent") ?? null,
    location:
      [city ? decodeURIComponent(city) : null, country]
        .filter(Boolean)
        .join(", ") || null,
  };
}

/**
 * Records one event in the audit log, and sends it to Telegram if
 * AUDIT_TELEGRAM says so. Never throws: a failed write is logged, and
 * whatever was being done carries on (sign-in must not fail because the
 * log couldn't be written).
 */
export async function audit(
  action: AuditAction,
  detail?: string | null,
  headers?: Headers | null,
) {
  const from = headers ?? (await requestHeaders().catch(() => null));
  const origin = requestOrigin(from);
  // Read before this event is written, so it can't match itself.
  const level =
    action === "sign-in"
      ? await signInLevel(detail, origin)
      : AUDIT_TELEGRAM[action];
  try {
    await db.insert(auditEvents).values({
      action,
      detail: detail ?? null,
      ...origin,
    });
  } catch (error) {
    console.error(`audit(${action}) failed`, error);
  }
  if (level) {
    await sendTelegram(
      {
        title: detail
          ? `${AUDIT_LABEL[action]} · ${detail}`
          : AUDIT_LABEL[action],
        lines: [
          [origin.location, origin.ipAddress].filter(Boolean).join(" · ") ||
            null,
          origin.userAgent ? describeDevice(origin.userAgent) : null,
        ],
        url: level === "alert" ? appUrl("/settings#security") : undefined,
      },
      { quiet: level === "quiet" },
    );
  }
}

/** "quiet" for a passkey sign-in from a familiar device and city, else "alert". */
async function signInLevel(
  method: string | null | undefined,
  origin: ReturnType<typeof requestOrigin>,
): Promise<"alert" | "quiet"> {
  try {
    const previous = await db
      .select({
        userAgent: auditEvents.userAgent,
        location: auditEvents.location,
      })
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.action, "sign-in"),
          gte(
            auditEvents.at,
            new Date(Date.now() - FAMILIAR_DAYS * 86_400_000),
          ),
        ),
      )
      .limit(500);
    return familiarSignIn(method, origin, previous) ? "quiet" : "alert";
  } catch (error) {
    // Can't tell: buzz.
    console.error("[audit] sign-in history unreadable", error);
    return "alert";
  }
}
