import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkState,
  liveUrl,
  parsePost,
  postFile,
  postFiles,
} from "../lib/post-review.ts";

test("postFile recognises posts and TIL notes only", () => {
  assert.deepEqual(postFile("apps/blog/content/posts/expo-ota.mdx"), {
    path: "apps/blog/content/posts/expo-ota.mdx",
    kind: "post",
    slug: "expo-ota",
  });
  assert.equal(postFile("apps/blog/content/til/git-tip.mdx")?.kind, "til");
  assert.equal(postFile("apps/blog/content/post-ideas.md"), null);
  assert.equal(postFile("apps/blog/content/posts/nested/x.mdx"), null);
  assert.equal(postFile("apps/blog/content/posts/../secret.mdx"), null);
  assert.equal(postFile("apps/admin/lib/x.mdx"), null);
});

test("postFiles skips removed files", () => {
  const files = postFiles([
    { filename: "apps/blog/content/posts/a.mdx", status: "added" },
    { filename: "apps/blog/content/posts/b.mdx", status: "removed" },
    { filename: "apps/blog/content/posts/c.mdx", status: "modified" },
    { filename: "apps/blog/content/post-ideas.md", status: "modified" },
  ]);
  assert.deepEqual(
    files.map((f) => f.slug),
    ["a", "c"],
  );
});

test("parsePost reads frontmatter and counts words", () => {
  const source = `---
title: Hello
dek: A dek.
date: 2026-11-02
topics:
  - ai
takeaways:
  - "One"
faq:
  - question: Why?
    answer: Because.
  - question: Missing answer
---

${"word ".repeat(450)}`;
  const post = parsePost(source, "fallback");
  assert.equal(post.frontmatter.title, "Hello");
  assert.equal(post.frontmatter.date, "2026-11-02");
  assert.deepEqual(post.frontmatter.topics, ["ai"]);
  assert.deepEqual(post.frontmatter.takeaways, ["One"]);
  assert.deepEqual(post.frontmatter.faq, [
    { question: "Why?", answer: "Because." },
  ]);
  assert.equal(post.wordCount, 450);
  assert.equal(post.readMinutes, 2);
});

test("parsePost falls back when frontmatter is missing", () => {
  const post = parsePost("Just a body.", "slug-title");
  assert.equal(post.frontmatter.title, "slug-title");
  assert.equal(post.frontmatter.dek, null);
  assert.deepEqual(post.frontmatter.topics, []);
  assert.equal(post.readMinutes, 1);
});

test("TIL tags count as topics", () => {
  const post = parsePost("---\ntitle: T\ntags:\n  - git\n---\nx", "t");
  assert.deepEqual(post.frontmatter.topics, ["git"]);
});

test("liveUrl", () => {
  assert.equal(
    liveUrl({ path: "", kind: "post", slug: "a" }),
    "https://www.dainemawer.com/a",
  );
  assert.equal(
    liveUrl({ path: "", kind: "til", slug: "b" }),
    "https://www.dainemawer.com/til/b",
  );
});

test("checkState", () => {
  const done = { status: "completed", conclusion: "success" };
  assert.equal(checkState([], []), "none");
  assert.equal(checkState([done], [{ state: "success" }]), "passing");
  assert.equal(checkState([done], [{ state: "pending" }]), "pending");
  assert.equal(
    checkState([{ status: "in_progress", conclusion: null }], []),
    "pending",
  );
  assert.equal(
    checkState(
      [
        { status: "in_progress", conclusion: null },
        { status: "completed", conclusion: "failure" },
      ],
      [],
    ),
    "failing",
  );
  assert.equal(checkState([done], [{ state: "error" }]), "failing");
  assert.equal(
    checkState([{ status: "completed", conclusion: "skipped" }], []),
    "passing",
  );
});
