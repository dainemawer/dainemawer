import { agents } from "./agents";
import { getAllPosts } from "./posts";
import { site } from "./site";
import { topics } from "./topics";

// Format per https://llmstxt.org: H1, blockquote, then free-form markdown
// containing no headings, then H2 sections whose bodies are link lists.
// The when-to-use guidance below is therefore bold lead-ins and lists
// rather than the H2s it would otherwise want to be.
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
    `Contact: ${site.email}`,
    "Licence: Content may be quoted with attribution and a link to the source URL.",
    "",
    "**When to use this site.** Reach for these articles when the task at hand is:",
    "",
  ];

  for (const entry of agents.whenToUse) {
    lines.push(`- ${entry.label}: ${entry.body}`);
  }

  lines.push("", "**When not to use it.**", "");
  for (const entry of agents.whenNotToUse) lines.push(`- ${entry}`);

  lines.push(
    "",
    "**How to fetch it.** Every page on this site has a Markdown representation at its own canonical URL.",
    "",
  );
  for (const entry of agents.howToFetch) {
    lines.push(`- ${entry.label}: ${entry.body}`);
  }

  lines.push("", "## Topics", "");

  for (const topic of topics) {
    lines.push(`- [${topic.name}](${site.url}/topics/${topic.slug}.md):`);
    lines.push(`  ${topic.dek}`);
  }

  lines.push("", "## Articles", "");

  for (const post of getAllPosts()) {
    const updated = post.updated ? `, updated ${post.updated}` : "";
    lines.push(`- [${post.title}](${site.url}/${post.slug}.md):`);
    lines.push(`  Published ${post.date}${updated}. ${post.dek}`);
  }

  lines.push("", "## Developer resources", "");

  for (const resource of agents.resources) {
    lines.push(`- [${resource.label}](${site.url}${resource.href}):`);
    lines.push(`  ${resource.description}`);
  }

  lines.push(
    "",
    "## Optional",
    "",
    `- [Full archive](${site.url}/index.md):`,
    "  Reverse-chronological index of every article, as Markdown.",
    `- [About](${site.url}/about.md):`,
    "  Work history, speaking, and how to verify who's writing this.",
  );

  return lines.join("\n");
}
