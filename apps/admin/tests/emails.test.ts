import assert from "node:assert/strict";
import { test } from "node:test";
import { signInEmail } from "../lib/emails/sign-in.ts";

const url =
  "https://admin.dainemawer.com/api/auth/magic-link/verify?token=abc&callbackURL=%2F";

test("signInEmail escapes the link in HTML and keeps it raw in text", () => {
  const { html, text, subject } = signInEmail({ url, minutes: 15 });
  assert.equal(subject, "Your admin.dainemawer.com sign-in link");
  assert.ok(text.includes(url));
  assert.ok(
    html.includes(
      'href="https://admin.dainemawer.com/api/auth/magic-link/verify?token=abc&amp;callbackURL=%2F"',
    ),
  );
  assert.ok(!html.includes("token=abc&callbackURL"));
});

test("signInEmail loads the logo from the link's own origin", () => {
  const { html } = signInEmail({
    url: "http://localhost:3001/api/auth/magic-link/verify?token=x",
    minutes: 15,
  });
  assert.ok(html.includes('src="http://localhost:3001/email/logo.png"'));
});
