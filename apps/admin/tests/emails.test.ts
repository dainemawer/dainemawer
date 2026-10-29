import assert from "node:assert/strict";
import { test } from "node:test";
import { emailSignInOffEmail, signInEmail } from "../lib/emails/sign-in.ts";
import { describeDevice } from "../lib/user-agent.ts";

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

test("emailSignInOffEmail sends no sign-in link", () => {
  const { html, text } = emailSignInOffEmail({
    origin: "https://admin.dainemawer.com",
  });
  assert.ok(!html.includes("magic-link"));
  assert.ok(text.includes("ALLOW_EMAIL_SIGN_IN=1"));
});

test("describeDevice names common browsers", () => {
  assert.equal(
    describeDevice(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    ),
    "Chrome on macOS",
  );
  assert.equal(
    describeDevice(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    ),
    "Safari on iOS",
  );
  assert.equal(describeDevice(null), "Unknown device");
});
