# Agent Guide

Working conventions for this repo — a pnpm + Turborepo monorepo.

## Layout

- `apps/blog` — the Next.js blog ([dainemawer.com](https://www.dainemawer.com)). See its own [AGENTS.md](./apps/blog/AGENTS.md) for blog-specific conventions (Markdown content negotiation, this repo's customized Next.js).
- `apps/portal` — the client portal (project status, change requests, estimates, invoicing). Still a bare shell — see its own [AGENTS.md](./apps/portal/AGENTS.md).
- `packages/db` — Prisma schema and client for the portal's data, on Neon Postgres. See the technical spec's "Data model" section for the entities.

## Package manager

This project uses **pnpm** + **Turborepo** exclusively. Do not use `npm` or `yarn` — there is no `package-lock.json` or `yarn.lock`, only `pnpm-lock.yaml`. Run `corepack enable` if `pnpm` isn't already available; the pinned version is in the root `package.json`'s `packageManager` field.

- `pnpm install` — install dependencies for every workspace package
- `pnpm dev` — start every app's dev server (`turbo run dev`)
- `pnpm build` — production build for every app (`turbo run build`)
- `pnpm lint` — run Biome checks across the whole repo (code files only — see each app's `.remarkrc.mjs` for MDX prose)
- `pnpm lint:mdx` — lint each app's MDX prose with remark (`turbo run lint:mdx`)
- `pnpm test` — run each app's unit tests (`turbo run test`)
- `pnpm format` — apply Biome formatting across the whole repo

Scope a command to one app with `pnpm --filter <name> <script>` (e.g. `pnpm --filter blog dev`) or `turbo run build --filter=blog`. App names match their `package.json` `name` field, not the directory (`blog`, not `apps/blog`).

## Commits

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, etc.). This is enforced by commitlint via a Lefthook `commit-msg` hook.

## Git hooks

Git hooks are managed by [Lefthook](https://github.com/evilmartians/lefthook) (`lefthook.yml`), installed automatically via the `prepare` script on `pnpm install`:

- `pre-commit` — runs Biome against staged code files (repo-wide) and remark against staged `apps/blog/content/posts/*.mdx` files
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
