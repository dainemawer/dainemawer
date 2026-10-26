import "server-only";
import { headers as requestHeaders } from "next/headers";
import { db } from "@/db";
import { auditEvents } from "@/db/schema";
import {
  AUDIT_LABEL,
  AUDIT_TELEGRAM,
  type AuditAction,
} from "@/lib/audit-actions";
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
  try {
    await db.insert(auditEvents).values({
      action,
      detail: detail ?? null,
      ...origin,
    });
  } catch (error) {
    console.error(`audit(${action}) failed`, error);
  }
  const level = AUDIT_TELEGRAM[action];
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
