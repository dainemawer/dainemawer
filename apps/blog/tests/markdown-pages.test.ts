import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildNotFoundMarkdown,
  buildPostMarkdown,
  buildTopicMarkdown,
  resolveMarkdownDocument,
} from "@/lib/markdown-pages";
import type { PostContent } from "@/lib/mdx";
import type { Post } from "@/lib/posts";
import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";
import { topics } from "@/lib/topics";

const post: Post = {
  slug: "measuring-inp",
  title: "Measuring INP",
  dek: "What the field data says that the lab does not.",
  date: "2026-01-04",
  updated: "2026-02-01",
  readTime: "7 min read",
  wordCount: 1400,
  topics: ["performance"],
};

const content: PostContent = {
  shortAnswer: "Measure INP in the field first.",
  takeaways: ["Lab numbers are a hypothesis."],
  faq: [{ question: "Is TBT a proxy?", answer: "Only a rough one." }],
  toc: [],
  rawBody: "## Body\n\nSome prose.",
  needsRewrite: false,
};

describe("buildNotFoundMarkdown", () => {
  const body = buildNotFoundMarkdown("/__probe-does-not-exist");

  it("is a markdown document with an explanation, not a bare status", () => {
    assert.match(body, /^# 404 — Page not found/);
    // The Is Agentic check wants at least 20 characters of explanation.
    assert.ok(body.length > 200);
  });

  it("names the path that was missed", () => {
    assert.match(body, /__probe-does-not-exist/);
  });

  it("points at the sitemap, llms.txt and the markdown index", () => {
    assert.ok(body.includes(`${site.url}/sitemap.xml`));
    assert.ok(body.includes(`${site.url}/llms.txt`));
    assert.ok(body.includes(`${site.url}/index.md`));
  });

  it("explains how to ask for markdown", () => {
    assert.match(body, /Accept: text\/markdown/);
  });
});

describe("buildPostMarkdown", () => {
  const body = buildPostMarkdown(post, content);

  it("leads with the title, dek and publication dates", () => {
    assert.match(body, /^# Measuring INP\n/);
    assert.ok(
      body.includes("> What the field data says that the lab does not."),
    );
    assert.ok(body.includes("Published 2026-01-04, updated 2026-02-01"));
  });

  it("carries the short answer, body, takeaways and questions", () => {
    assert.ok(body.includes("Measure INP in the field first."));
    assert.ok(body.includes("Some prose."));
    assert.ok(body.includes("## Takeaways"));
    assert.ok(body.includes("- Lab numbers are a hypothesis."));
    assert.ok(body.includes("### Is TBT a proxy?"));
  });

  it("names the canonical HTML URL for attribution", () => {
    assert.ok(body.includes(`Canonical HTML: ${site.url}/measuring-inp`));
  });

  it("omits the takeaways and questions headings when there are none", () => {
    const bare = buildPostMarkdown(post, {
      ...content,
      takeaways: [],
      faq: [],
    });
    assert.ok(!bare.includes("## Takeaways"));
    assert.ok(!bare.includes("## Questions"));
  });
});

describe("buildTopicMarkdown", () => {
  it("lists the topic's articles as markdown twins", () => {
    const body = buildTopicMarkdown(topics[0], [post]);
    assert.ok(body.includes(`[Measuring INP](${site.url}/measuring-inp.md)`));
    assert.ok(body.includes("1 article filed under"));
  });

  it("pluralises the article count", () => {
    const body = buildTopicMarkdown(topics[0], [post, { ...post, slug: "b" }]);
    assert.ok(body.includes("2 articles filed under"));
  });
});

describe("resolveMarkdownDocument", () => {
  it("serves the homepage index for no segments and for /index.md", () => {
    for (const segments of [[], ["index"]]) {
      const doc = resolveMarkdownDocument(segments);
      assert.equal(doc.status, 200);
      assert.match(doc.body, /^# Daine Mawer\n/);
      assert.ok(doc.body.includes("## Articles"));
    }
  });

  it("links every published post from the homepage index", () => {
    const { body } = resolveMarkdownDocument([]);
    for (const published of getAllPosts()) {
      assert.ok(
        body.includes(`${site.url}/${published.slug}.md`),
        `homepage index is missing ${published.slug}`,
      );
    }
  });

  it("serves each static page", () => {
    for (const [slug, heading] of [
      ["about", "# About Daine Mawer"],
      ["uses", "# Uses — Daine Mawer"],
      ["now", "# Now — Daine Mawer"],
      ["privacy", "# Privacy — Daine Mawer"],
      ["agents", "# Agent and developer resources — Daine Mawer"],
    ] as const) {
      const doc = resolveMarkdownDocument([slug]);
      assert.equal(doc.status, 200, `${slug} should resolve`);
      assert.match(doc.body, new RegExp(`^${heading}`));
    }
  });

  it("tells agents when to use the site on the agents page", () => {
    const { body } = resolveMarkdownDocument(["agents"]);
    assert.ok(body.includes("## When to use this site"));
    assert.ok(body.includes("## When not to use this site"));
    assert.ok(body.includes("## Endpoints"));
  });

  it("serves a real post from content/posts", () => {
    const [published] = getAllPosts();
    const doc = resolveMarkdownDocument([published.slug]);
    assert.equal(doc.status, 200);
    assert.match(doc.body, /^# /);
    assert.ok(doc.body.includes(published.dek));
  });

  it("serves each topic index", () => {
    for (const topic of topics) {
      const doc = resolveMarkdownDocument(["topics", topic.slug]);
      assert.equal(doc.status, 200, `${topic.slug} should resolve`);
      assert.ok(doc.body.startsWith(`# ${topic.name} — ${site.name}`));
    }
  });

  it("404s an unknown slug, topic or nested path with a markdown body", () => {
    for (const segments of [
      ["__ora-404-probe-pckhuo0z"],
      ["topics", "not-a-topic"],
      ["deep", "nested", "nonsense"],
    ]) {
      const doc = resolveMarkdownDocument(segments);
      assert.equal(doc.status, 404);
      assert.match(doc.body, /^# 404 — Page not found/);
      assert.ok(doc.body.includes(`/${segments.join("/")}`));
    }
  });
});
