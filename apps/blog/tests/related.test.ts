import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPostMarkdown } from "@/lib/markdown-pages";
import type { Post } from "@/lib/posts";
import { getRelatedPosts } from "@/lib/related";

function post(slug: string, date: string, topics: string[]): Post {
  return {
    slug,
    title: slug,
    dek: `${slug} dek`,
    date,
    readTime: "5 min read",
    wordCount: 1000,
    topics,
  };
}

// Newest first, as getAllPosts returns them.
const all = [
  post("e", "2026-05-01", ["ai"]),
  post("d", "2026-04-01", ["css", "javascript"]),
  post("c", "2026-03-01", ["css"]),
  post("b", "2026-02-01", ["javascript"]),
  post("a", "2026-01-01", ["css", "javascript"]),
];

describe("getRelatedPosts", () => {
  it("never includes the post itself", () => {
    const slugs = getRelatedPosts(all[1], all, 10).map((p) => p.slug);
    assert.ok(!slugs.includes("d"));
  });

  it("ranks by shared topics, then newest", () => {
    // `a` shares both topics with `d`, `c` and `b` share one each.
    assert.deepEqual(
      getRelatedPosts(all[4], all, 3).map((p) => p.slug),
      ["d", "c", "b"],
    );
  });

  it("fills with the newest posts when too few share a topic", () => {
    // Only `e` is on "ai", so `c`'s topic matches rank first and the rest is recency.
    assert.deepEqual(
      getRelatedPosts(all[0], all, 2).map((p) => p.slug),
      ["d", "c"],
    );
  });

  it("returns fewer than the limit only when there are fewer posts", () => {
    assert.equal(getRelatedPosts(all[0], [all[0]], 2).length, 0);
  });
});

describe("buildPostMarkdown related links", () => {
  const content = {
    shortAnswer: "x",
    takeaways: [],
    faq: [],
    toc: [],
    rawBody: "Body.",
    needsRewrite: false,
  };

  it("lists related posts under Keep reading", () => {
    const body = buildPostMarkdown(all[0], content, [all[1]]);
    assert.match(body, /## Keep reading/);
    assert.ok(body.includes("/d.md"));
  });

  it("omits the section with none", () => {
    assert.doesNotMatch(buildPostMarkdown(all[0], content), /Keep reading/);
  });
});
