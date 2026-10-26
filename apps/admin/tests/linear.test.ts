import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { validSignature } from "../lib/linear-signature.ts";
import { fraction } from "../lib/projects.ts";

test("fraction accepts 0–1 and percentages, clamped", () => {
  assert.equal(fraction(0.43), 0.43);
  assert.equal(fraction(43), 0.43);
  assert.equal(fraction(1), 1);
  assert.equal(fraction(100), 1);
  assert.equal(fraction(-2), 0);
});

test("validSignature checks the HMAC of the raw body", () => {
  const body = '{"type":"Project","webhookTimestamp":1}';
  const sign = (secret: string) =>
    new Headers({
      "linear-signature": createHmac("sha256", secret)
        .update(body)
        .digest("hex"),
    });
  assert.equal(validSignature(body, sign("s3cret"), "s3cret"), true);
  assert.equal(validSignature(body, sign("other"), "s3cret"), false);
  assert.equal(validSignature(`${body} `, sign("s3cret"), "s3cret"), false);
  assert.equal(validSignature(body, new Headers(), "s3cret"), false);
});
