/**
 * Announces a newly published post or TIL on Bluesky and X. Run by
 * .github/workflows/announce.yml after a merge to main; safe to run by hand.
 *
 *   pnpm --filter blog announce <slug|til/slug> [--dry-run]
 *
 * The text is the frontmatter `social` field if present (write it with the
 * distribution-kit skill), else the dek. Each network is skipped when its
 * credentials are missing, so Bluesky alone works with no X account:
 *
 * - Bluesky (free): BLUESKY_HANDLE, BLUESKY_APP_PASSWORD (Settings → App
 *   passwords — never the account password).
 * - X (pay-per-use, ~$0.20 per post with a link): X_API_KEY, X_API_SECRET,
 *   X_ACCESS_TOKEN, X_ACCESS_SECRET from a console.x.com app with write
 *   access.
 */
import { createHmac, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { site } from "../lib/site";
import { utmUrl } from "../lib/utm";

const [rawPath, ...flags] = process.argv.slice(2);
const dryRun = flags.includes("--dry-run");

if (!rawPath) {
  console.error(
    "Usage: pnpm --filter blog announce <slug|til/slug> [--dry-run]",
  );
  process.exit(1);
}

const path = rawPath.replace(/^\/|\.mdx$/g, "");
const isTil = path.startsWith("til/");
const file = isTil
  ? join(process.cwd(), "content/til", `${path.slice(4)}.mdx`)
  : join(process.cwd(), "content/posts", `${path}.mdx`);
const { data } = matter(readFileSync(file, "utf-8"));

const canonical = `${site.url}/${path}`;
const text: string = (data.social ?? data.dek ?? data.title).trim();
const prefix = isTil ? "TIL: " : "";

/** Trims to `max` characters on a word boundary, with an ellipsis. */
function clip(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

/** Waits for the Vercel deploy to serve the page, so nobody clicks a 404. */
async function waitForLive(url: string, attempts = 40): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const response = await fetch(url, { headers: { accept: "text/html" } });
    if (response.ok) return response.text();
    await new Promise((resolve) => setTimeout(resolve, 15_000));
  }
  throw new Error(`${url} still isn't live after ${attempts * 15}s`);
}

async function postToBluesky(html: string) {
  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !password)
    return console.log("Bluesky: no credentials, skipped.");

  const link = utmUrl(`/${path}`, "bluesky", { content: "auto" });
  const body = clip(`${prefix}${text}`, 290);
  if (dryRun)
    return console.log(`Bluesky (dry run):\n${body}\n[card → ${link}]`);

  const pds = "https://bsky.social/xrpc";
  const session = await fetch(`${pds}/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: handle, password }),
  }).then((r) => r.json() as Promise<{ did: string; accessJwt: string }>);
  const auth = { authorization: `Bearer ${session.accessJwt}` };

  // A link card renders far better than a bare URL in the feed; the OG
  // image becomes its thumbnail.
  let thumb: unknown;
  const ogImage = html.match(
    /<meta property="og:image" content="([^"]+)"/,
  )?.[1];
  if (ogImage) {
    const image = await fetch(ogImage.replace(/&amp;/g, "&"));
    if (image.ok) {
      const upload = await fetch(`${pds}/com.atproto.repo.uploadBlob`, {
        method: "POST",
        headers: {
          ...auth,
          "content-type": image.headers.get("content-type") ?? "image/png",
        },
        body: Buffer.from(await image.arrayBuffer()),
      }).then((r) => r.json() as Promise<{ blob: unknown }>);
      thumb = upload.blob;
    }
  }

  const response = await fetch(`${pds}/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: { ...auth, "content-type": "application/json" },
    body: JSON.stringify({
      repo: session.did,
      collection: "app.bsky.feed.post",
      record: {
        $type: "app.bsky.feed.post",
        text: body,
        createdAt: new Date().toISOString(),
        langs: ["en"],
        embed: {
          $type: "app.bsky.embed.external",
          external: {
            uri: link,
            title: data.title,
            description: data.dek ?? "",
            ...(thumb ? { thumb } : {}),
          },
        },
      },
    }),
  });
  if (!response.ok)
    throw new Error(`Bluesky: ${response.status} ${await response.text()}`);
  console.log("Bluesky: posted.");
}

// OAuth 1.0a user-context signing for POST /2/tweets. The JSON body is not
// part of the signature base string, only the oauth_* parameters.
function oauthHeader(method: string, url: string): string {
  const params: Record<string, string> = {
    oauth_consumer_key: process.env.X_API_KEY ?? "",
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: process.env.X_ACCESS_TOKEN ?? "",
    oauth_version: "1.0",
  };
  const encode = (value: string) =>
    encodeURIComponent(value).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  const paramString = Object.keys(params)
    .toSorted()
    .map((key) => `${encode(key)}=${encode(params[key])}`)
    .join("&");
  const base = [method, encode(url), encode(paramString)].join("&");
  const key = `${encode(process.env.X_API_SECRET ?? "")}&${encode(process.env.X_ACCESS_SECRET ?? "")}`;
  params.oauth_signature = createHmac("sha1", key)
    .update(base)
    .digest("base64");
  return `OAuth ${Object.keys(params)
    .toSorted()
    .map((k) => `${encode(k)}="${encode(params[k])}"`)
    .join(", ")}`;
}

async function postToX() {
  const keys = [
    "X_API_KEY",
    "X_API_SECRET",
    "X_ACCESS_TOKEN",
    "X_ACCESS_SECRET",
  ];
  if (keys.some((key) => !process.env[key]))
    return console.log("X: no credentials, skipped.");

  // X counts every URL as 23 characters regardless of length.
  const body = `${clip(`${prefix}${text}`, 280 - 24)} ${utmUrl(`/${path}`, "x", { content: "auto" })}`;
  if (dryRun) return console.log(`X (dry run):\n${body}`);

  const url = "https://api.x.com/2/tweets";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: oauthHeader("POST", url),
      "content-type": "application/json",
    },
    body: JSON.stringify({ text: body }),
  });
  if (!response.ok)
    throw new Error(`X: ${response.status} ${await response.text()}`);
  console.log("X: posted.");
}

const html = dryRun ? "" : await waitForLive(canonical);
const results = await Promise.allSettled([postToBluesky(html), postToX()]);
const failures = results.filter(
  (r): r is PromiseRejectedResult => r.status === "rejected",
);
for (const failure of failures) console.error(failure.reason);
process.exit(failures.length > 0 ? 1 : 0);
