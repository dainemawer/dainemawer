import "server-only";
import {
  formatTelegram,
  splitTelegram,
  type TelegramMessage,
} from "@/lib/telegram-format";

// Notifications to your own Telegram chat: the only channel for them. The bot
// only ever sends to TELEGRAM_CHAT_ID. What you send it arrives at
// app/api/webhooks/telegram, which answers questions (lib/assistant). Without TELEGRAM_BOT_TOKEN (local dev) the message
// is logged instead, like lib/mail.ts does for email.

export function telegramConfigured() {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID,
  );
}

/** The app's public origin, for links in messages. */
export const appUrl = (path = "") =>
  `${process.env.BETTER_AUTH_URL ?? "http://localhost:3001"}${path}`;

/**
 * Sends one message. Never throws: a notification must not fail the thing
 * it reports on. `quiet` delivers it without a sound or vibration.
 * Returns whether Telegram accepted it.
 */
export async function sendTelegram(
  message: TelegramMessage,
  { quiet = false }: { quiet?: boolean } = {},
) {
  const text = formatTelegram(message);
  if (!telegramConfigured()) {
    console.info(
      `[telegram] TELEGRAM_BOT_TOKEN not set — not sending.\n${text}\n`,
    );
    return false;
  }
  return callTelegram("sendMessage", {
    text,
    parse_mode: "HTML",
    disable_notification: quiet,
    link_preview_options: { is_disabled: true },
  });
}

/** The assistant's answer, as plain text, in as many messages as it takes. */
export async function replyTelegram(text: string) {
  if (!telegramConfigured()) {
    console.info(`[telegram] reply:\n${text}\n`);
    return false;
  }
  let ok = true;
  for (const part of splitTelegram(text)) {
    ok =
      (await callTelegram("sendMessage", {
        text: part,
        link_preview_options: { is_disabled: true },
      })) && ok;
  }
  return ok;
}

/** Shows "typing…" in the chat for about five seconds. */
export async function typingTelegram() {
  if (!telegramConfigured()) return false;
  return callTelegram("sendChatAction", { action: "typing" });
}

async function callTelegram(method: string, body: Record<string, unknown>) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          ...body,
        }),
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) {
      // Telegram's description says what's wrong ("chat not found"); the
      // URL holds the token, so it's never logged.
      const { description } = (await response.json().catch(() => ({}))) as {
        description?: string;
      };
      console.error(
        `[telegram] ${method} ${response.status}: ${description ?? "failed"}`,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error(
      `[telegram] ${method} failed:`,
      error instanceof Error ? error.name : "unknown error",
    );
    return false;
  }
}
