import { about } from "./about";
import { agents } from "./agents";
import { contact } from "./contact";
import type { PostContent } from "./mdx";
import { getPostContent } from "./mdx";
import { now } from "./now";
import type { Post } from "./posts";
import { getAllPosts, getPostBySlug } from "./posts";
import { privacySections, privacyUpdated } from "./privacy";
import { site } from "./site";
import { getTopicBySlug, topics } from "./topics";
import { usesReviewedOn, usesSections } from "./uses";

export type MarkdownDocument = { body: string; status: 200 | 404 };

/** Absolute URL for the markdown twin of a site path. */
function mdUrl(path: string): string {
  return path === "/" ? `${site.url}/index.md` : `${site.url}${path}.md`;
}

function url(path: string): string {
  return `${site.url}${path}`;
}

// Every document ends the same way: an agent that landed on a leaf page
// still gets told how the rest of the site is addressable.
function footer(canonical: string): string[] {
  return [
    "",
    "---",
    "",
    `Canonical HTML: ${url(canonical)}`,
    `Markdown index: ${url("/index.md")} · Agent guide: ${url("/agents.md")} · [llms.txt](${url("/llms.txt")})`,
    `Attribution: ${site.name} — ${url("/about")}`,
  ];
}

function postLine(post: Post): string[] {
  const updated = post.updated ? `, updated ${post.updated}` : "";
  return [
    `- [${post.title}](${mdUrl(`/${post.slug}`)}):`,
    `  Published ${post.date}${updated}. ${post.readTime}. ${post.dek}`,
  ];
}

export function buildHomeMarkdown(posts: Post[]): string {
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.role} at ${site.company.name}, based in ${site.location}. Frontend engineering, web performance, JavaScript, CSS, and engineering management.`,
    "",
    "This is the Markdown representation of the homepage: a reverse-chronological index of every article. Each link below points at the article's Markdown twin.",
    "",
    "## Articles",
    "",
  ];

  for (const post of posts) lines.push(...postLine(post));

  lines.push("", "## Topics", "");
  for (const topic of topics) {
    lines.push(
      `- [${topic.name}](${mdUrl(`/topics/${topic.slug}`)}): ${topic.dek}`,
    );
  }

  lines.push("", "## Pages", "");
  for (const page of [
    [
      "About",
      "/about",
      "Work history, speaking, and how to verify who's writing this.",
    ],
    ["Uses", "/uses", "The hardware and software behind the articles."],
    ["Now", "/now", "What has my attention this month."],
    [
      "Agents",
      "/agents",
      "When to use this site, and every machine-readable endpoint.",
    ],
    ["Privacy", "/privacy", "What this site collects, and what it doesn't."],
  ] as const) {
    lines.push(`- [${page[0]}](${mdUrl(page[1])}): ${page[2]}`);
  }

  lines.push("", "## Machine-readable", "");
  for (const resource of agents.resources) {
    lines.push(
      `- [${resource.label}](${url(resource.href)}): ${resource.description}`,
    );
  }

  return [...lines, ...footer("/")].join("\n");
}

export function buildPostMarkdown(post: Post, content: PostContent): string {
  const updated = post.updated ? `, updated ${post.updated}` : "";
  const lines = [
    `# ${post.title}`,
    "",
    `> ${post.dek}`,
    "",
    `Published ${post.date}${updated} — ${post.readTime}`,
    "",
    content.shortAnswer,
    "",
    content.rawBody,
  ];

  if (content.takeaways.length > 0) {
    lines.push("", "## Takeaways", "");
    for (const takeaway of content.takeaways) lines.push(`- ${takeaway}`);
  }

  if (content.faq.length > 0) {
    lines.push("", "## Questions", "");
    for (const item of content.faq) {
      lines.push(`### ${item.question}`, "", item.answer, "");
    }
  }

  return [...lines, ...footer(`/${post.slug}`)].join("\n");
}

export function buildTopicMarkdown(
  topic: { slug: string; name: string; dek: string },
  posts: Post[],
): string {
  const lines = [
    `# ${topic.name} — ${site.name}`,
    "",
    `> ${topic.dek}`,
    "",
    `${posts.length} article${posts.length === 1 ? "" : "s"} filed under ${topic.name}.`,
    "",
    "## Articles",
    "",
  ];

  for (const post of posts) lines.push(...postLine(post));

  return [...lines, ...footer(`/topics/${topic.slug}`)].join("\n");
}

export function buildAboutMarkdown(): string {
  const lines = [
    `# About ${site.name}`,
    "",
    `> ${site.role} at ${site.company.name}, based in ${site.location}.`,
    "",
    about.summary,
    "",
    "## Work",
    "",
  ];

  for (const entry of about.work) {
    lines.push(`- **${entry.period}** — ${entry.description}`);
  }

  lines.push(
    "",
    "## Clients",
    "",
    about.clients.join(", "),
    "",
    "## Speaking",
    "",
  );
  for (const talk of about.speaking) {
    lines.push(`- **${talk.venue}** — ${talk.topic}`);
  }

  lines.push("", "## Writes about", "");
  for (const topic of about.writesAbout) {
    lines.push(`- [${topic.label}](${url(topic.href)})`);
  }

  lines.push("", "## Verify", "");
  for (const link of about.verify) {
    lines.push(`- [${link.label}](${link.href})`);
  }

  return [...lines, ...footer("/about")].join("\n");
}

export function buildUsesMarkdown(): string {
  const lines = [
    `# Uses — ${site.name}`,
    "",
    "> The hardware and software I actually open every day, and why.",
    "",
    `Reviewed ${usesReviewedOn}. No affiliate links.`,
    "",
  ];

  for (const section of usesSections) {
    lines.push(`## ${section.label}`, "");
    for (const item of section.items) {
      lines.push(`- **${item.name}** — ${item.description}`);
    }
    lines.push("");
  }

  return [...lines, ...footer("/uses")].join("\n");
}

export function buildNowMarkdown(): string {
  const lines = [
    `# Now — ${site.name}`,
    "",
    "> What has my attention this month, kept honest by a visible date.",
    "",
    `Updated ${now.updated.day}/${now.updated.month}/${now.updated.year}. Cape Town, GMT+2.`,
    "",
  ];

  for (const entry of now.entries) {
    lines.push(`## ${entry.label}`, "", entry.body, "");
  }

  lines.push("## Previously", "", now.archive.join(", "));

  return [...lines, ...footer("/now")].join("\n");
}

export function buildContactMarkdown(): string {
  const lines = [
    `# Contact — ${site.name}`,
    "",
    `> ${contact.dek}`,
    "",
    contact.meta.join(" · "),
    "",
    contact.summary,
    "",
    "## What to write about",
    "",
  ];

  for (const reason of contact.reasons) {
    lines.push(`- **${reason.label}** — ${reason.hint}`);
  }

  lines.push(
    "",
    "## Not taking",
    "",
    `${contact.notTaking} ${contact.clientAccess.lead} [${contact.clientAccess.label}](${contact.clientAccess.href})`,
    "",
    "## Direct",
    "",
  );

  for (const item of contact.elsewhere) {
    lines.push(`- [${item.label}](${item.href})`);
  }

  // The HTML page carries a form; a client reading the markdown twin has no
  // way to submit one, so it gets told the equivalent route explicitly.
  lines.push(
    "",
    `The HTML page at ${url("/contact")} also carries a form. It delivers to ${site.email}, so email is the equivalent and simpler route for a non-browser client.`,
  );

  return [...lines, ...footer("/contact")].join("\n");
}

export function buildPrivacyMarkdown(): string {
  const lines = [
    `# Privacy — ${site.name}`,
    "",
    "> What this site collects, what it doesn't, and who to ask about it.",
    "",
    `Updated ${privacyUpdated}.`,
    "",
  ];

  for (const section of privacySections) {
    lines.push(`## ${section.label}`, "", section.body, "");
  }

  lines.push(`Questions: ${site.email}`);

  return [...lines, ...footer("/privacy")].join("\n");
}

export function buildAgentsMarkdown(): string {
  const lines = [
    `# Agent and developer resources — ${site.name}`,
    "",
    `> ${agents.summary}`,
    "",
    "## When to use this site",
    "",
  ];

  for (const entry of agents.whenToUse) {
    lines.push(`- **${entry.label}** — ${entry.body}`);
  }

  lines.push("", "## When not to use this site", "");
  for (const entry of agents.whenNotToUse) lines.push(`- ${entry}`);

  lines.push("", "## How to fetch content", "");
  for (const entry of agents.howToFetch) {
    lines.push(`- **${entry.label}** — ${entry.body}`);
  }

  lines.push("", "## Endpoints", "");
  for (const resource of agents.resources) {
    lines.push(
      `- [${resource.label}](${url(resource.href)}): ${resource.description}`,
    );
  }

  lines.push(
    "",
    "## Attribution",
    "",
    agents.citation,
    "",
    `Contact: ${agents.contact}`,
  );

  return [...lines, ...footer("/agents")].join("\n");
}

/**
 * The body served for a path with no page behind it. Agents get a real
 * explanation and somewhere to go next rather than an empty 404 — the
 * status code alone tells them nothing about where the content moved.
 */
export function buildNotFoundMarkdown(pathname: string): string {
  return [
    "# 404 — Page not found",
    "",
    `> No page exists at \`${pathname}\` on ${site.name}'s site. The link may be out of date, or the path mistyped.`,
    "",
    "Nothing was removed from this site without a redirect, so a 404 here usually means the path never existed.",
    "",
    "## Where to look instead",
    "",
    `- [Markdown index](${url("/index.md")}): every article, each linking to its own Markdown twin.`,
    `- [llms.txt](${url("/llms.txt")}): structured index of articles, topics and feeds.`,
    `- [llms-full.txt](${url("/llms-full.txt")}): the full text of every article in one file.`,
    `- [Agent and developer resources](${url("/agents.md")}): when to use this site, and every endpoint on it.`,
    `- [Sitemap](${url("/sitemap.xml")}): every canonical URL.`,
    "",
    "## How to request Markdown",
    "",
    `Send \`Accept: text/markdown\` to any canonical URL on ${site.url}, or append \`.md\` to the path.`,
    "",
    "---",
    "",
    `${site.name} — ${site.url}`,
  ].join("\n");
}

const STATIC_PAGES: Record<string, () => string> = {
  about: buildAboutMarkdown,
  uses: buildUsesMarkdown,
  now: buildNowMarkdown,
  privacy: buildPrivacyMarkdown,
  contact: buildContactMarkdown,
  agents: buildAgentsMarkdown,
};

/**
 * Maps the path segments of a markdown request onto a document. Segments
 * come from `/md/[[...path]]`, so `[]` and `["index"]` are both the
 * homepage — the latter is what `/index.md` rewrites to.
 */
export function resolveMarkdownDocument(segments: string[]): MarkdownDocument {
  const pathname = `/${segments.join("/")}`;

  if (
    segments.length === 0 ||
    (segments.length === 1 && segments[0] === "index")
  ) {
    return { body: buildHomeMarkdown(getAllPosts()), status: 200 };
  }

  if (segments.length === 1) {
    const slug = segments[0];

    const staticPage = STATIC_PAGES[slug];
    if (staticPage) return { body: staticPage(), status: 200 };

    const post = getPostBySlug(slug);
    const content = post ? getPostContent(slug) : undefined;
    if (post && content) {
      return { body: buildPostMarkdown(post, content), status: 200 };
    }
  }

  if (segments.length === 2 && segments[0] === "topics") {
    const topic = getTopicBySlug(segments[1]);
    if (topic) {
      const posts = getAllPosts().filter((post) =>
        post.topics.includes(topic.slug),
      );
      return { body: buildTopicMarkdown(topic, posts), status: 200 };
    }
  }

  return { body: buildNotFoundMarkdown(pathname), status: 404 };
}
