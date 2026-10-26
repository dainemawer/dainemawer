"use server";

import { headers } from "next/headers";
import { audit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { errorMessage } from "@/lib/errors";
import { requireSession } from "@/lib/session";
import { appUrl, sendTelegram, telegramConfigured } from "@/lib/telegram";

/** Signs out every session but this one: a lost laptop, a sign-in you didn't make. */
export async function signOutOtherSessions(): Promise<{ error?: string }> {
  await requireSession();
  try {
    await auth.api.revokeOtherSessions({ headers: await headers() });
  } catch (error) {
    return { error: errorMessage(error, "Couldn't sign out other sessions.") };
  }
  await audit("sessions-revoked");
  return {};
}

/** Proves the bot token and chat ID work, from Settings. */
export async function sendTestTelegram(): Promise<{ error?: string }> {
  await requireSession();
  if (!telegramConfigured()) {
    return { error: "Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID first." };
  }
  const sent = await sendTelegram({
    title: "Test from your admin",
    lines: ["Notifications are working."],
    url: appUrl("/settings#notifications"),
  });
  return sent
    ? {}
    : { error: "Telegram didn't accept it. Check the token and chat ID." };
}
