import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildTilIndexMarkdown,
  buildTilMarkdown,
  resolveMarkdownDocument,
} from "@/lib/markdown-pages";
import { site } from "@/lib/site";
import type { Til } from "@/lib/til";
import { getAllTils, getTilContent, groupTilsByYear } from "@/lib/til";

const til: Til = {
  slug: "example",
  title: "An example",
  date: "2026-03-02",
  tags: ["git"],
};

describe("groupTilsByYear", () => {
  it("buckets by year, newest year first, keeping entry order", () => {
    const grouped = groupTilsByYear([
      { ...til, slug: "a", date: "2026-03-02" },
      { ...til, slug: "b", date: "2026-01-10" },
      { ...til, slug: "c", date: "2025-12-31" },
    ]);
    assert.deepEqual(
      grouped.map((g) => [g.year, g.tils.map((t) => t.slug)]),
      [
        [2026, ["a", "b"]],
        [2025, ["c"]],
      ],
    );
  });
});

describe("content/til", () => {
  const tils = getAllTils();

  it("loads entries newest first", () => {
    assert.ok(tils.length > 0);
    const dates = tils.map((t) => t.date);
    assert.deepEqual(dates, dates.toSorted().toReversed());
  });

  it("gives every entry a title, an ISO date and a body", () => {
    for (const entry of tils) {
      assert.ok(entry.title, `${entry.slug} has no title`);
      assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/, `${entry.slug} date`);
      assert.ok(
        getTilContent(entry.slug)?.rawBody.trim(),
        `${entry.slug} body`,
      );
    }
  });
});

describe("TIL markdown twins", () => {
  it("renders an entry with its canonical URL", () => {
    const body = buildTilMarkdown(til, { rawBody: "Some note." });
    assert.match(body, /^# An example/);
    assert.ok(body.includes("Some note."));
    assert.ok(body.includes(`Canonical HTML: ${site.url}/til/example`));
  });

  it("renders the index with every body inline", () => {
    const body = buildTilIndexMarkdown([
      { til, content: { rawBody: "Some note." } },
    ]);
    assert.ok(body.includes("## An example"));
    assert.ok(body.includes("Some note."));
    assert.ok(body.includes(`Canonical HTML: ${site.url}/til`));
  });

  it("resolves /til and /til/<slug>, and 404s an unknown entry", () => {
    const [first] = getAllTils();
    assert.equal(resolveMarkdownDocument(["til"]).status, 200);
    assert.equal(resolveMarkdownDocument(["til", first.slug]).status, 200);
    assert.equal(resolveMarkdownDocument(["til", "nope"]).status, 404);
  });
});
