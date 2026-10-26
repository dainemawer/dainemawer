import { createHmac, timingSafeEqual } from "node:crypto";

/** Linear signs a webhook's raw body with HMAC-SHA256 (hex) in `linear-signature`. */
export function validSignature(raw: string, headers: Headers, secret: string) {
  const given = Buffer.from(headers.get("linear-signature") ?? "", "hex");
  const expected = createHmac("sha256", secret).update(raw).digest();
  return given.length === expected.length && timingSafeEqual(given, expected);
}
