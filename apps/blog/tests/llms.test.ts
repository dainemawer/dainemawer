import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { agents } from "@/lib/agents";
import { generateLlmsTxt } from "@/lib/llms";
import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";

const llms = generateLlmsTxt();
const lines = llms.split("\n");

describe("llms.txt", () => {
  // https://llmstxt.org — H1, blockquote, heading-free prose, then H2
  // sections whose bodies are link lists.
  it("opens with an H1 naming the site", () => {
    assert.equal(lines[0], `# ${site.name}`);
  });

  it("follows the H1 with a blockquote summary", () => {
    assert.ok(lines[2].startsWith("> "));
  });

  it("uses no headings between the blockquote and the first H2", () => {
    const firstH2 = lines.findIndex((line) => line.startsWith("## "));
    assert.ok(firstH2 > 0, "expected at least one H2 section");
    const preamble = lines.slice(1, firstH2);
    assert.ok(
      !preamble.some((line) => /^#{1,6}\s/.test(line)),
      "the free-form section must not contain headings",
    );
  });

  it("carries the when-to-use guidance before the link sections", () => {
    const firstH2 = llms.indexOf("\n## ");
    const preamble = llms.slice(0, firstH2);
    assert.ok(preamble.includes("**When to use this site.**"));
    assert.ok(preamble.includes("**When not to use it.**"));
    assert.ok(preamble.includes("**How to fetch it.**"));
    for (const entry of agents.whenToUse) {
      assert.ok(
        preamble.includes(entry.label),
        `missing use case: ${entry.label}`,
      );
    }
  });

  it("lists every article as a markdown twin", () => {
    for (const post of getAllPosts()) {
      assert.ok(
        llms.includes(`[${post.title}](${site.url}/${post.slug}.md)`),
        `missing article: ${post.slug}`,
      );
    }
  });

  it("publishes the machine-readable endpoints under their own section", () => {
    assert.ok(llms.includes("## Developer resources"));
    for (const resource of agents.resources) {
      assert.ok(
        llms.includes(`[${resource.label}](${site.url}${resource.href})`),
        `missing resource: ${resource.label}`,
      );
    }
  });

  it("gives every H2 section a non-empty list of links", () => {
    const sections = llms.split(/^## /m).slice(1);
    assert.ok(sections.length >= 3);
    for (const section of sections) {
      const [heading, ...body] = section.split("\n");
      assert.ok(
        body.some((line) => /^- \[.+\]\(https?:\/\/.+\)/.test(line)),
        `section "${heading}" has no link list`,
      );
    }
  });
});
