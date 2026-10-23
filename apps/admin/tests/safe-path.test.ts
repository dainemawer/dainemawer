import assert from "node:assert/strict";
import { test } from "node:test";
import { safeLocalPath } from "../lib/safe-path.ts";

test("safeLocalPath keeps same-origin paths", () => {
  assert.equal(safeLocalPath("/quotes/new"), "/quotes/new");
  assert.equal(
    safeLocalPath("/invoices/new?customer=1"),
    "/invoices/new?customer=1",
  );
});

test("safeLocalPath rejects anything that leaves the origin", () => {
  for (const bad of [
    "//evil.com",
    "/\\evil.com",
    "https://evil.com",
    "evil.com",
    "/\\/evil.com",
    "",
    null,
    undefined,
  ]) {
    assert.equal(safeLocalPath(bad), null, String(bad));
  }
});
