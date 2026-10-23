/**
 * Returns `value` only if it's a same-origin path ("/quotes/new?x=1"),
 * else null. String checks alone miss `/\evil.com`, which browsers treat
 * as protocol-relative, so this resolves it against a placeholder origin.
 */
export function safeLocalPath(value: string | null | undefined): string | null {
  if (!value?.startsWith("/")) return null;
  const base = "http://local.invalid";
  try {
    const url = new URL(value, base);
    return url.origin === base ? `${url.pathname}${url.search}` : null;
  } catch {
    return null;
  }
}
