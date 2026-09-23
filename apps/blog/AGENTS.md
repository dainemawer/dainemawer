# Agent Guide — blog

App-specific conventions for `apps/blog` (the dainemawer.com Next.js site). Repo-wide conventions (package manager, commits, git hooks, CI, skills) live in the [root AGENTS.md](../../AGENTS.md) — read that first. This section is hand-maintained — only the block below it is auto-managed by `next dev`.

## Markdown content negotiation

Every page is served as HTML or Markdown from the same canonical URL, per [acceptmarkdown.com](https://acceptmarkdown.com). The moving parts:

- `lib/content-negotiation.ts` — `Accept` parsing (q-values, specificity, `q=0`), `Vary` merging, path mapping. Pure, and unit-tested.
- `proxy.ts` — rewrites a page request to its Markdown twin when `text/markdown` wins, returns 406 when the client accepts neither, and passes RSC/Server Function traffic through untouched.
- `app/md/[[...path]]/route.ts` — the single Markdown handler, reached three ways: the negotiation rewrite, the public `/:slug.md` rewrites in `next.config.ts`, and directly.
- `lib/markdown-pages.ts` — builds the Markdown for every route, including the 404 body.
- `lib/agents.ts` — the when-to-use guidance and endpoint list shared by `/agents`, `/agents.md` and `llms.txt`.

Adding a page means adding it to `lib/markdown-pages.ts` (and `app/sitemap.ts`), or agents get the 404 document for it.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
