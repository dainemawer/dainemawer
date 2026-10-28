import assert from "node:assert/strict";
import { test } from "node:test";
import { canRequestLink } from "../lib/sign-in-domain.ts";

test("canRequestLink allows only exact @dainemawer.com addresses", () => {
  assert.equal(canRequestLink("hello@dainemawer.com"), true);
  assert.equal(canRequestLink("  Hello@DaineMawer.com "), true);
  for (const email of [
    "hello@gmail.com",
    "hello@mail.dainemawer.com",
    "hello@dainemawer.com.evil.test",
    "hello@evil-dainemawer.com",
    "hello@dainemawer.co",
    "a@b@dainemawer.com",
    "@dainemawer.com",
    "hello world@dainemawer.com",
    "",
    undefined,
    ["hello@dainemawer.com"],
  ]) {
    assert.equal(canRequestLink(email), false, String(email));
  }
});
