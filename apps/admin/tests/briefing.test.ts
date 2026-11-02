import assert from "node:assert/strict";
import { test } from "node:test";
import type { AttentionItem } from "../lib/attention-items.ts";
import { briefingMessage, MAX_ITEMS } from "../lib/briefing-message.ts";
import { formatTelegram } from "../lib/telegram-format.ts";

const item = (
  id: string,
  urgency: AttentionItem["urgency"] = "normal",
): AttentionItem => ({
  id,
  urgency,
  title: `Do ${id}`,
  detail: "x",
  href: "/",
});
const base = { today: "2026-11-02", url: "https://admin/" };

test("nothing to say, nothing sent", () => {
  assert.equal(
    briefingMessage({ ...base, weighedToday: true, items: [], notes: [] }),
    null,
  );
  // The dashboard's weigh-in line alone isn't news once weighed.
  assert.equal(
    briefingMessage({
      ...base,
      weighedToday: true,
      items: [item("weigh-in", "low")],
      notes: [],
    }),
    null,
  );
});

test("weigh-in first, then needs you, then overnight", () => {
  const message = briefingMessage({
    ...base,
    weighedToday: false,
    items: [item("weigh-in", "low"), item("a", "urgent"), item("b")],
    notes: ["New subscription: Netflix, R199.00 a month"],
  });
  assert.equal(message?.title, "Morning, Monday 2 Nov");
  const text = formatTelegram(message ?? { title: "" });
  assert.match(
    text,
    /Weigh in[\s\S]*\n\nNeeds you:\n‼️ Do a \(x\)\n• Do b \(x\)\n\nOvernight:\n• New subscription/,
  );
  assert.equal(text.match(/weigh-in/gi), null);
});

test("a long list is cut with a count", () => {
  const items = Array.from({ length: MAX_ITEMS + 3 }, (_, i) => item(`i${i}`));
  const message = briefingMessage({
    ...base,
    weighedToday: true,
    items,
    notes: [],
  });
  const lines = message?.lines ?? [];
  assert.equal(lines.at(-1), "and 3 more on the dashboard");
  assert.equal(lines[0], "Needs you:");
});
