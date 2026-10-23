# Agent Guide — admin

App-specific conventions for `apps/admin` (admin.dainemawer.com: customers, quotes, invoices). Repo-wide conventions live in the [root AGENTS.md](../../AGENTS.md) — read that first. This section is hand-maintained — only the block below it is auto-managed by `next dev`.

## Running it

- `pnpm --filter admin dev` serves on port 3001. It first starts a real local Postgres 17 (the `embedded-postgres` binaries, data in `.data/postgres`), applies migrations and seeds it, then runs `next dev` against it (`db/local.mts`). Don't swap this for an in-process database such as PGlite: `next dev` runs the app in several processes, and they overwrote each other's files.
- `db:migrate` and `db:seed` are only for a remote database and need `DATABASE_URL` in the shell. `pnpm dev` ignores a `DATABASE_URL` in `.env.local` on purpose: `vercel env pull` writes the production one there.
- Without `RESEND_API_KEY`, emails (magic links included) are printed to the dev server log instead of sent. Sign in by opening the logged link.
- Copy `.env.example` to `.env.local`; only `BETTER_AUTH_SECRET` is required locally.
- `.data/` is disposable: delete it to start from an empty database.

## Conventions

- **Money is integer minor units** (`bigint`, cents) end to end; quantities are hundredths. All arithmetic goes through `lib/totals.ts`, which the editor (live totals), the Server Actions (stored totals) and the PDF share. Never compute totals anywhere else.
- **Quotes and invoices are one `documents` table** with a `kind`. Every page is shared in `components/document-pages.tsx`; the route files under `app/(app)/quotes` and `app/(app)/invoices` only pass their kind.
- **`expired` and `overdue` are derived** from dates on read (`displayStatus` in `lib/documents.ts`), never stored. `allowedActions` is the one source of truth for which transitions a status permits; Server Actions re-check it.
- **Numbers are gapless per kind and year**: allocated by an upsert on `counters` inside the create transaction. That's why invoices are voided, never deleted.
- **Auth**: Better Auth with magic links, sign-up disabled, one user (`ADMIN_EMAIL`, created by `db:seed`). `proxy.ts` only checks for a session cookie; every page and Server Action calls `requireSession()`, and the PDF route handlers check the session themselves.
- Server Actions that the client calls for errors return `{ error }` instead of throwing — thrown messages are redacted in production.
- Schema changes: edit `db/schema.ts`, then `pnpm --filter admin db:generate` and commit the SQL in `db/migrations`. Vercel runs `db:migrate` before production builds only (`vercel.json`): previews share the production database, so a PR must never migrate it.
- UI is shadcn/ui (`components/ui`, added with the shadcn CLI) themed onto the blog's tokens in `app/globals.css`. Use the semantic classes (`text-muted-foreground`, `bg-muted`); `--color-muted` means a background here, unlike in the blog.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
