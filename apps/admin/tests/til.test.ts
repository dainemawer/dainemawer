import assert from "node:assert/strict";
import { test } from "node:test";
import matter from "gray-matter";
import {
  normaliseDraft,
  parseTilCommand,
  slugify,
  tilFile,
} from "../lib/til.ts";

test("til: and /til start a TIL", () => {
  assert.equal(
    parseTilCommand("til: git switch - goes back"),
    "git switch - goes back",
  );
  assert.equal(parseTilCommand("TIL : something"), "something");
  assert.equal(parseTilCommand("/til something new"), "something new");
  assert.equal(parseTilCommand("/til@AstraBot something"), "something");
  assert.equal(
    parseTilCommand("til:\nline one\nline two"),
    "line one\nline two",
  );
  assert.equal(parseTilCommand("/til"), "");
});

test("other messages aren't TILs", () => {
  assert.equal(parseTilCommand("til when is the meeting?"), null);
  assert.equal(parseTilCommand("until: friday"), null);
  assert.equal(parseTilCommand("what did I learn? til: x"), null);
  assert.equal(parseTilCommand("/tilt"), null);
  assert.equal(parseTilCommand("88.2"), null);
});

test("slugify", () => {
  assert.equal(
    slugify("Claude Desktop has an iOS Simulator!"),
    "claude-desktop-has-an-ios-simulator",
  );
  assert.equal(slugify("Café — résumé"), "cafe-resume");
  assert.equal(slugify("!!!"), "til");
  assert.ok(slugify("a ".repeat(80)).length <= 60);
  assert.ok(!slugify("a ".repeat(80)).endsWith("-"));
});

test("normaliseDraft fixes bad slugs and tags", () => {
  const draft = normaliseDraft({
    slug: "Not A Slug!",
    title: "  Two\n lines ",
    tags: ["AI", "Claude Code", "ai", "til", "a", "b", "c"],
    body: "Body\n\n",
  });
  assert.equal(draft.slug, "not-a-slug");
  assert.equal(draft.title, "Two lines");
  assert.deepEqual(draft.tags, ["ai", "claude-code", "a", "b"]);
  assert.equal(draft.body, "Body\n");
});

test("tilFile round-trips through gray-matter, quotes included", () => {
  const file = tilFile(
    {
      slug: "x",
      title: "It's: a 'title' with # and ---",
      tags: ["ai"],
      body: "Hello `code`.\n",
    },
    "2026-11-02",
  );
  const { data, content } = matter(file);
  assert.equal(data.title, "It's: a 'title' with # and ---");
  assert.equal(data.date, "2026-11-02");
  assert.deepEqual(data.tags, ["ai"]);
  assert.equal(content.trim(), "Hello `code`.");
  assert.ok(
    !tilFile(
      { slug: "x", title: "T", tags: [], body: "B\n" },
      "2026-11-02",
    ).includes("tags"),
  );
});
