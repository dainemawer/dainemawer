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
