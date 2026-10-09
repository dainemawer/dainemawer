import { site } from "@/lib/site";
import { getAllTils, TIL_DESCRIPTION } from "@/lib/til";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Its own feed rather than items in /rss.xml, so subscribers to the articles
// don't get a stream of short notes they didn't ask for.
export function GET() {
  const items = getAllTils()
    .map(
      (til) => `    <item>
      <title>${escapeXml(til.title)}</title>
      <link>${site.url}/til/${til.slug}</link>
      <guid>${site.url}/til/${til.slug}</guid>
      <pubDate>${new Date(til.date).toUTCString()}</pubDate>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${site.name} — TIL`)}</title>
    <link>${site.url}/til</link>
    <description>${escapeXml(TIL_DESCRIPTION)}</description>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
