import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { utmUrl } from "@/lib/utm";

describe("utmUrl", () => {
  it("tags a post with source, medium and the slug as campaign", () => {
    assert.equal(
      utmUrl("/temporal-api-replacing-date", "linkedin"),
      "https://www.dainemawer.com/temporal-api-replacing-date?utm_source=linkedin&utm_medium=social&utm_campaign=temporal-api-replacing-date",
    );
  });

  it("flattens nested paths into the campaign", () => {
    assert.match(
      utmUrl("/til/git-switch-dash", "x"),
      /utm_campaign=til-git-switch-dash/,
    );
  });

  it("lowercases content so placements don't split in reports", () => {
    assert.match(
      utmUrl("/spec-driven-development", "reddit", {
        content: "ExperiencedDevs",
      }),
      /utm_content=experienceddevs$/,
    );
  });

  it("lets an explicit campaign win over the slug", () => {
    assert.match(
      utmUrl("/", "newsletter", { campaign: "digest-2026-10-17" }),
      /utm_campaign=digest-2026-10-17/,
    );
  });
});
