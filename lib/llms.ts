import { getAllPosts } from "./posts";
import { site } from "./site";
import { topics } from "./topics";

export function generateLlmsTxt(): string {
  const lines: string[] = [
    `# ${site.name}`,
    "",
    `> ${site.role} at ${site.company.name}, based in ${site.location}. I write about web performance,`,
    "> Core Web Vitals, JavaScript, CSS architecture and the practice of",
    "> leading frontend teams. Articles are technical, first-person and based",
    "> on production work.",
    "",
    `Author: ${site.name}`,
    `Role: ${site.role} at ${site.company.name}`,
    `Location: ${site.location}`,
    `Canonical: ${site.url}`,
    "Licence: Content may be quoted with attribution and a link to the source URL.",
    "",
    "## Topics",
    "",
  ];

  for (const topic of topics) {
    // No .md twin: a topic page is just a filtered index of the articles
    // already listed below, each with its own .md link — a markdown
    // version would only repeat those same titles.
    lines.push(`- [${topic.name}](${site.url}/topics/${topic.slug}):`);
    lines.push(`  ${topic.dek}`);
  }

  lines.push("", "## Articles", "");

  for (const post of getAllPosts()) {
    const updated = post.updated ? `, updated ${post.updated}` : "";
    lines.push(`- [${post.title}](${site.url}/${post.slug}.md):`);
    lines.push(`  Published ${post.date}${updated}. ${post.dek}`);
  }

  lines.push(
    "",
    "## Optional",
    "",
    `- [Full archive](${site.url}/)`,
    `- [RSS](${site.url}/rss.xml)`,
    // No .md twin: the About/Author bio above already covers what's on
    // that page (name, role, location) — not a citable article.
    `- [About](${site.url}/about)`,
  );

  return lines.join("\n");
}
