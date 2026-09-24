import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendVaryAccept,
  markdownPathFor,
  preferredType,
  servesNonHtml,
} from "@/lib/content-negotiation";

describe("preferredType", () => {
  // The test vectors published at
  // https://acceptmarkdown.com/guides/accept-parsing#test-vectors
  const vectors: [string | null, string | null][] = [
    ["text/markdown", "text/markdown"],
    ["text/markdown, text/html;q=0.8", "text/markdown"],
    ["text/html", "text/html"],
    ["text/markdown;q=0, text/html", "text/html"],
    [null, "text/html"],
    ["*/*", "text/html"],
  ];

  for (const [header, expected] of vectors) {
    it(`serves ${expected} for Accept: ${header ?? "(absent)"}`, () => {
      assert.equal(preferredType(header), expected);
    });
  }

  it("prefers markdown when it is listed first at equal quality", () => {
    assert.equal(
      preferredType("text/markdown, text/html, */*"),
      "text/markdown",
    );
  });

  it("honours quality values over list order", () => {
    assert.equal(
      preferredType("text/markdown;q=0.2, text/html;q=0.9"),
      "text/html",
    );
    assert.equal(
      preferredType("text/html;q=0.2, text/markdown;q=0.9"),
      "text/markdown",
    );
  });

  it("lets a specific range override a wildcard regardless of q", () => {
    // RFC 9110 §12.5.1 — `*/*;q=1` must not resurrect a type the client
    // explicitly refused with q=0.
    assert.equal(preferredType("text/html;q=0, */*"), "text/markdown");
    assert.equal(preferredType("text/markdown;q=0, */*"), "text/html");
  });

  it("matches subtype wildcards", () => {
    assert.equal(preferredType("text/*"), "text/html");
    assert.equal(preferredType("text/*;q=0.5, text/markdown"), "text/markdown");
  });

  it("returns null when the client accepts neither representation", () => {
    assert.equal(preferredType("application/pdf"), null);
    assert.equal(preferredType("image/png, image/webp"), null);
    assert.equal(preferredType("text/html;q=0, text/markdown;q=0"), null);
  });

  it("treats an empty Accept as accepting nothing, unlike an absent one", () => {
    assert.equal(preferredType(""), null);
    assert.equal(preferredType(undefined), "text/html");
  });

  it("ignores case and surrounding whitespace", () => {
    assert.equal(preferredType("  TEXT/MARKDOWN ;Q=1 "), "text/markdown");
  });

  it("ignores a malformed q value rather than dropping the entry", () => {
    assert.equal(preferredType("text/markdown;q=banana"), "text/markdown");
  });

  it("does not match text/markdown on a substring of another type", () => {
    assert.equal(preferredType("application/text/markdown-ish"), null);
  });
});

describe("appendVaryAccept", () => {
  it("sets Vary when there is none", () => {
    const headers = new Headers();
    appendVaryAccept(headers);
    assert.equal(headers.get("Vary"), "Accept");
  });

  it("appends to Next's own Vary rather than replacing it", () => {
    const headers = new Headers({ Vary: "rsc, next-router-state-tree" });
    appendVaryAccept(headers);
    assert.equal(headers.get("Vary"), "rsc, next-router-state-tree, Accept");
  });

  it("is idempotent, whatever the casing", () => {
    const headers = new Headers({ Vary: "rsc, accept" });
    appendVaryAccept(headers);
    assert.equal(headers.get("Vary"), "rsc, accept");
  });

  it("leaves a wildcard Vary alone", () => {
    const headers = new Headers({ Vary: "*" });
    appendVaryAccept(headers);
    assert.equal(headers.get("Vary"), "*");
  });
});

describe("markdownPathFor", () => {
  it("maps the homepage to the markdown index", () => {
    assert.equal(markdownPathFor("/"), "/md");
  });

  it("prefixes every other page path", () => {
    assert.equal(markdownPathFor("/about"), "/md/about");
    assert.equal(markdownPathFor("/topics/css"), "/md/topics/css");
    assert.equal(markdownPathFor("/some-article"), "/md/some-article");
  });

  it("ignores a trailing slash", () => {
    assert.equal(markdownPathFor("/about/"), "/md/about");
  });
});

describe("servesNonHtml", () => {
  it("recognises Next's generated image routes, which have no extension", () => {
    for (const path of [
      "/opengraph-image",
      "/css-if-function-safely/opengraph-image",
      "/twitter-image",
      "/icon",
      "/apple-icon",
    ]) {
      assert.equal(servesNonHtml(path), true, path);
    }
  });

  it("leaves real page paths alone", () => {
    for (const path of [
      "/",
      "/about",
      "/agents",
      "/topics/css",
      "/opengraph-image-explained",
      "/why-i-dropped-the-icon-font",
    ]) {
      assert.equal(servesNonHtml(path), false, path);
    }
  });
});
