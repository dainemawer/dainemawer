# Agent Guide

Working conventions for this repo. This section is hand-maintained — only the block below it is auto-managed by `next dev`.

## Package manager

This project uses **pnpm** exclusively. Do not use `npm` or `yarn` — there is no `package-lock.json` or `yarn.lock`, only `pnpm-lock.yaml`. Run `corepack enable` if `pnpm` isn't already available; the pinned version is in `package.json`'s `packageManager` field.

- `pnpm install` — install dependencies
- `pnpm dev` — start the dev server
- `pnpm build` — production build
- `pnpm lint` — run Biome checks (code files only — see `.remarkrc.mjs` for MDX prose)
- `pnpm lint:mdx` — lint `content/posts/*.mdx` prose with remark (headings, lists, links)
- `pnpm format` — apply Biome formatting

## Commits

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, etc.). This is enforced by commitlint via a Lefthook `commit-msg` hook.

## Git hooks

Git hooks are managed by [Lefthook](https://github.com/evilmartians/lefthook) (`lefthook.yml`), installed automatically via the `prepare` script on `pnpm install`:

- `pre-commit` — runs Biome against staged code files and remark against staged `content/posts/*.mdx` files
- `commit-msg` — validates the commit message against Conventional Commits

Do not bypass hooks (`--no-verify`) unless explicitly instructed to.

## CI

`.github/workflows/lint.yml` runs Biome lint checks on every push and pull request against `main`.

## Skills

Skills installed via [skills.sh](https://www.skills.sh) live in `.agents/skills/<name>/` (with `.claude/skills/<name>` symlinks), pinned in `skills-lock.json`. Claude Code auto-discovers and triggers these from their `SKILL.md` description — no action needed there. Agents without that mechanism should read the relevant `.agents/skills/<name>/SKILL.md` (or `AGENTS.md`, a flattened version of the same content) directly, using the table below to pick the right one.

| Skill | Use when |
| --- | --- |
| `vercel-react-best-practices` | Writing, reviewing, or refactoring React/Next.js code for performance (data fetching, bundle size, rendering). |
| `vercel-composition-patterns` | Designing component APIs — compound components, avoiding boolean prop proliferation, reusable patterns. |
| `vercel-react-view-transitions` | Adding page/route transitions or animating UI state with React's View Transition API. |
| `web-design-guidelines` | Reviewing UI code for interface/UX/accessibility guideline compliance. |
| `accessibility` | Auditing or improving WCAG 2.2 accessibility compliance. |
| `web-perf` | Profiling page load performance and Core Web Vitals via Chrome DevTools MCP. |
| `vercel-optimize` | Investigating Vercel cost or performance issues on a deployed project (requires `vercel` CLI + Observability Plus). |
| `deploy-to-vercel` | Deploying the app or creating a preview link on request. |
| `seo-audit` | Diagnosing technical or on-page SEO issues (rankings, indexing, meta tags, Core Web Vitals). |
| `schema` | Adding or fixing schema.org / JSON-LD structured data for rich results. |
| `ai-seo` | Optimizing content to be cited/surfaced by AI search engines (AI Overviews, ChatGPT, Perplexity). |
| `writing-guidelines` | Reviewing blog post prose, voice, and tone against the writing handbook. |
| `best-practices` | General security, compatibility, and code quality review. |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
