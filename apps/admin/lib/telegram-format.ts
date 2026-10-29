// Message formatting for lib/telegram.ts, kept free of server-only imports
// so it can be unit tested. Telegram's HTML mode only needs &, < and >
// escaped; everything else passes through.

export type TelegramMessage = {
  /** The bold first line. */
  title: string;
  /** Plain-text lines under it; escaped here. */
  lines?: (string | null | undefined)[];
  /** Absolute app URL, shown as an "Open" link. */
  url?: string;
};

export function escapeTelegram(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function formatTelegram({ title, lines = [], url }: TelegramMessage) {
  const body = lines
    .filter((line): line is string => Boolean(line))
    .map(escapeTelegram);
  return [
    `<b>${escapeTelegram(title)}</b>`,
    ...body,
    url
      ? `<a href="${escapeTelegram(url).replaceAll('"', "&quot;")}">Open</a>`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Telegram's limit on one message's text. */
export const TELEGRAM_MAX = 4096;

/** Splits a long reply into messages, at a paragraph or line break where it can. */
export function splitTelegram(text: string, max = TELEGRAM_MAX): string[] {
  const parts: string[] = [];
  let rest = text.trim();
  while (rest.length > max) {
    const window = rest.slice(0, max);
    const at = Math.max(window.lastIndexOf("\n\n"), window.lastIndexOf("\n"));
    const cut = at > max / 2 ? at : max;
    parts.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  if (rest) parts.push(rest);
  return parts;
}

type TelegramUpdate = {
  update_id?: number;
  message?: {
    chat?: { id?: number };
    from?: { id?: number; is_bot?: boolean };
    text?: string;
  };
};

/**
 * The question in a webhook update, or null for anything else: other chats,
 * bots, edits, stickers and photos are all ignored. In a private chat the
 * chat ID is the sender's own ID, so both must be yours.
 */
export function incomingQuestion(
  update: unknown,
  chatId: string,
): { updateId: number; text: string } | null {
  const { update_id, message } = (update ?? {}) as TelegramUpdate;
  if (typeof update_id !== "number" || !message) return null;
  if (String(message.chat?.id) !== chatId) return null;
  if (String(message.from?.id) !== chatId || message.from?.is_bot) return null;
  const text = message.text?.trim();
  return text ? { updateId: update_id, text } : null;
}
