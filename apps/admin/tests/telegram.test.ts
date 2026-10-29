import assert from "node:assert/strict";
import { test } from "node:test";
import {
  escapeTelegram,
  formatTelegram,
  incomingQuestion,
  splitTelegram,
} from "../lib/telegram-format.ts";

test("escapeTelegram escapes only what Telegram's HTML mode needs", () => {
  assert.equal(
    escapeTelegram('R&D <b> "quoted"'),
    'R&amp;D &lt;b&gt; "quoted"',
  );
});

test("formatTelegram bolds the title, drops empty lines, links the URL", () => {
  const text = formatTelegram({
    title: "Signed in · Passkey",
    lines: ["Cape Town, ZA · 203.0.113.9", null, "<script>"],
    url: "https://admin.dainemawer.com/settings#security",
  });
  assert.equal(
    text,
    [
      "<b>Signed in · Passkey</b>",
      "Cape Town, ZA · 203.0.113.9",
      "&lt;script&gt;",
      '<a href="https://admin.dainemawer.com/settings#security">Open</a>',
    ].join("\n"),
  );
});

test("formatTelegram without lines or a URL is just the title", () => {
  assert.equal(formatTelegram({ title: "A & B" }), "<b>A &amp; B</b>");
});

const ME = "123456789";
const update = (message: Record<string, unknown>) => ({
  update_id: 42,
  message: {
    chat: { id: 123456789, type: "private" },
    from: { id: 123456789, is_bot: false },
    ...message,
  },
});

test("incomingQuestion takes text from your own chat", () => {
  assert.deepEqual(
    incomingQuestion(update({ text: "  What's overdue? " }), ME),
    { updateId: 42, text: "What's overdue?" },
  );
});

test("incomingQuestion ignores other chats, other senders and bots", () => {
  assert.equal(
    incomingQuestion(update({ chat: { id: 999 }, text: "hi" }), ME),
    null,
  );
  assert.equal(
    incomingQuestion(update({ from: { id: 999 }, text: "hi" }), ME),
    null,
  );
  assert.equal(
    incomingQuestion(
      update({ from: { id: 123456789, is_bot: true }, text: "hi" }),
      ME,
    ),
    null,
  );
});

test("incomingQuestion ignores non-text updates and an unset chat ID", () => {
  assert.equal(incomingQuestion(update({ sticker: {} }), ME), null);
  assert.equal(
    incomingQuestion({ update_id: 1, edited_message: {} }, ME),
    null,
  );
  assert.equal(incomingQuestion(null, ME), null);
  assert.equal(incomingQuestion(update({ text: "hi" }), ""), null);
});

test("splitTelegram keeps short replies whole", () => {
  assert.deepEqual(splitTelegram("Short answer."), ["Short answer."]);
});

test("splitTelegram breaks long replies at a line break", () => {
  const parts = splitTelegram(`${"a".repeat(30)}\n${"b".repeat(30)}`, 40);
  assert.deepEqual(parts, ["a".repeat(30), "b".repeat(30)]);
  assert.ok(splitTelegram("x".repeat(100), 40).every((p) => p.length <= 40));
});
