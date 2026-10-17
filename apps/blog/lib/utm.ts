import { site } from "./site";

/**
 * Every place a post gets shared, with the UTM source/medium it reports
 * as. GA4 and Vercel Analytics both pick these up from the landing URL with
 * no extra wiring. Keep values lowercase — GA4 treats "Reddit" and "reddit"
 * as different sources.
 */
export const CHANNELS = {
  linkedin: { source: "linkedin", medium: "social" },
  x: { source: "x", medium: "social" },
  bluesky: { source: "bluesky", medium: "social" },
  reddit: { source: "reddit", medium: "community" },
  hackernews: { source: "hackernews", medium: "community" },
  echojs: { source: "echojs", medium: "community" },
  changelog: { source: "changelog", medium: "community" },
  devto: { source: "devto", medium: "syndication" },
  hashnode: { source: "hashnode", medium: "syndication" },
  newsletter: { source: "newsletter", medium: "email" },
  pitch: { source: "pitch", medium: "email" },
  youtube: { source: "youtube", medium: "video" },
  tiktok: { source: "tiktok", medium: "video" },
} as const;

export type Channel = keyof typeof CHANNELS;

/**
 * The shareable URL for `path` on `channel`. `campaign` defaults to the
 * slug so traffic groups by post; `content` distinguishes placements within
 * a channel (a subreddit, a newsletter issue, a thread vs. a reply).
 */
export function utmUrl(
  path: string,
  channel: Channel,
  { campaign, content }: { campaign?: string; content?: string } = {},
): string {
  const url = new URL(path, site.url);
  const { source, medium } = CHANNELS[channel];
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set(
    "utm_campaign",
    campaign ??
      (url.pathname.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "home"),
  );
  if (content) url.searchParams.set("utm_content", content.toLowerCase());
  return url.toString();
}
