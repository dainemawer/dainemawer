import { codeToHtml } from "shiki";

/**
 * Server-side syntax highlighting, rendered to static HTML at request/build
 * time — no highlighter JS ships to the client, only the CodeBlock's copy
 * button is interactive.
 */
export function highlightCode(code: string, lang: string): Promise<string> {
  return codeToHtml(code, { lang, theme: "min-light" });
}
