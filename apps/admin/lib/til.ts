// TILs from Telegram: "til: <what you learned>" to the bot drafts a TIL
// and opens it as a pull request for /reviews (lib/til-draft.ts). This is
// the pure part, tested in tests/til.test.ts: recognising the command and
// turning a draft into the blog's MDX file.
//
// It's a command, not an assistant tool, on purpose: the assistant reads
// untrusted text (bank descriptions, calendar titles) and its tools never
// write. Only a message you typed in this exact shape opens a PR.

/** Ideas shorter than this aren't enough to write from. */
export const MIN_IDEA = 12;
export const MAX_IDEA = 4000;

/**
 * The idea in "til: …" or "/til …", or null for any other message. A bare
 * "til" isn't enough: it's also "until" ("til when is the meeting?").
 */
export function parseTilCommand(text: string): string | null {
  const match = /^\s*(?:\/til(?:@\w+)?(?:\s+|$)|til\s*:\s*)([\s\S]*)$/i.exec(
    text,
  );
  if (!match) return null;
  return match[1].trim();
}

export type TilDraft = {
  slug: string;
  title: string;
  tags: string[];
  body: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A URL slug from anything: lowercase words joined by hyphens, at most 60 characters. */
export function slugify(text: string): string {
  return (
    text
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/, "") || "til"
  );
}

/** Cleans what the model returned, so a sloppy slug or tag can't break the file. */
export function normaliseDraft(draft: TilDraft): TilDraft {
  const slug = SLUG.test(draft.slug)
    ? draft.slug.slice(0, 60)
    : slugify(draft.slug || draft.title);
  const tags = [
    ...new Set(draft.tags.map(slugify).filter((t) => t && t !== "til")),
  ].slice(0, 4);
  return {
    slug: slug.replace(/-+$/, ""),
    title: draft.title.replace(/\s+/g, " ").trim(),
    tags,
    body: `${draft.body.trim()}\n`,
  };
}

// Single-quoted YAML: only a single quote needs escaping (doubled).
const yamlString = (value: string) => `'${value.replaceAll("'", "''")}'`;

/** The file the blog reads (apps/blog/content/til/<slug>.mdx). */
export function tilFile(draft: TilDraft, date: string): string {
  const tags = draft.tags.length
    ? `tags:\n${draft.tags.map((t) => `  - ${t}`).join("\n")}\n`
    : "";
  return `---\ntitle: ${yamlString(draft.title)}\ndate: '${date}'\n${tags}---\n\n${draft.body}`;
}
