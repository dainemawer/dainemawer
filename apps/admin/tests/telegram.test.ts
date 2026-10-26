import assert from "node:assert/strict";
import { test } from "node:test";
import { escapeTelegram, formatTelegram } from "../lib/telegram-format.ts";

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
