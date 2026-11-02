import assert from "node:assert/strict";
import { test } from "node:test";
import { familiarSignIn } from "../lib/sign-in-alert.ts";

const MAC_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const MAC_CHROME_NEWER = MAC_CHROME.replace("140.0.0.0", "141.0.0.0");
const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const here = { userAgent: MAC_CHROME, location: "Cape Town, ZA" };

test("a passkey from a known device and city is familiar, across browser updates", () => {
  assert.equal(
    familiarSignIn("Passkey", { ...here, userAgent: MAC_CHROME_NEWER }, [here]),
    true,
  );
});

test("a new device, a new city or no history buzzes", () => {
  assert.equal(familiarSignIn("Passkey", here, []), false);
  assert.equal(
    familiarSignIn("Passkey", { ...here, userAgent: IPHONE_SAFARI }, [here]),
    false,
  );
  assert.equal(
    familiarSignIn("Passkey", { ...here, location: "Lagos, NG" }, [here]),
    false,
  );
});

test("email links and requests without location always buzz", () => {
  assert.equal(familiarSignIn("Email link", here, [here]), false);
  assert.equal(
    familiarSignIn("Passkey", { ...here, location: null }, [
      { ...here, location: null },
    ]),
    false,
  );
});
