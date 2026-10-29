import "server-only";
import { formatTelegram, type TelegramMessage } from "@/lib/telegram-format";

// Notifications to your own Telegram chat: the only channel for them. The bot
// only ever sends to TELEGRAM_CHAT_ID and has no webhook, so nothing it
// receives is ever read. Without TELEGRAM_BOT_TOKEN (local dev) the message
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
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text,
          parse_mode: "HTML",
          disable_notification: quiet,
          link_preview_options: { is_disabled: true },
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
        `[telegram] ${response.status}: ${description ?? "send failed"}`,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error(
      "[telegram] send failed:",
      error instanceof Error ? error.name : "unknown error",
    );
    return false;
  }
}
