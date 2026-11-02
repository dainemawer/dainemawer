import type { AttentionItem } from "@/lib/attention-items";
import type { TelegramMessage } from "@/lib/telegram-format";

// The 07:00 morning briefing's text: one message in place of the
// weigh-in nudge, the recurring-drafts list and the night's expense and
// subscription notes. Pure and tested in tests/briefing.test.ts; sent by
// lib/briefing.ts.

/** "Needs you" lines shown; the rest are counted. */
export const MAX_ITEMS = 6;

export function briefingMessage({
  today,
  weighedToday,
  items,
  notes,
  url,
}: {
  today: string;
  weighedToday: boolean;
  /** The dashboard's "Needs you" list, most urgent first. */
  items: AttentionItem[];
  /** What the night's jobs left (briefing_notes), oldest first. */
  notes: string[];
  url: string;
}): TelegramMessage | null {
  // The weigh-in has its own first line, so not twice.
  const todo = items.filter((item) => item.id !== "weigh-in");
  if (weighedToday && !todo.length && !notes.length) return null;

  const day = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${today}T00:00:00Z`));

  const lines: string[] = [];
  if (!weighedToday) {
    lines.push(
      "Weigh in after the bathroom, before breakfast. Send me the number, like 87.4.",
    );
  }
  if (todo.length) {
    // A leading newline: the formatter drops empty lines.
    lines.push(`${lines.length ? "\n" : ""}Needs you:`);
    for (const item of todo.slice(0, MAX_ITEMS)) {
      const mark = item.urgency === "urgent" ? "‼️" : "•";
      lines.push(
        `${mark} ${item.title}${item.detail ? ` (${item.detail})` : ""}`,
      );
    }
    if (todo.length > MAX_ITEMS) {
      lines.push(`and ${todo.length - MAX_ITEMS} more on the dashboard`);
    }
  }
  if (notes.length) {
    lines.push(`${lines.length ? "\n" : ""}Overnight:`);
    lines.push(...notes.map((note) => `• ${note}`));
  }
  return { title: `Morning, ${day}`, lines, url };
}
