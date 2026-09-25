# Agent Guide — portal

App-specific conventions for `apps/portal` (the client portal). Repo-wide conventions (package manager, commits, git hooks, CI, skills) live in the [root AGENTS.md](../../AGENTS.md) — read that first. This section is hand-maintained — only the block below it is auto-managed by `next dev`.

Still a bare shell — no auth, data, or portal-specific conventions to document yet. Update this section as those land.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
