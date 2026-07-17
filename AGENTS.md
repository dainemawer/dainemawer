# AGENTS.md

Standards and conventions for working on this repository. This is Daine Mawer's
personal site: a portfolio (case studies, services, experience) and a blog,
built as a single Next.js application.

## Tech Stack

| Concern         | Choice                                         |
|------------------|-------------------------------------------------|
| Framework        | Next.js 16 (App Router), TypeScript, React Server Components by default |
| Styling          | Tailwind CSS 4                                  |
| Animation        | Framer Motion (hover/interaction only — see Motion below) |
| Linting/Format   | Biome (replaces ESLint + Prettier)              |
| Package manager  | pnpm                                            |
| Fonts            | `next/font` (self-hosted): Inter (variable) + JetBrains Mono |
| Hosting          | Vercel                                          |
| Commit hooks     | Husky + Commitlint (Conventional Commits)       |

Always install the current major of each tool (Next.js 16.x, Tailwind 4.x,
Biome 2.x) rather than pinning to older majors.

## Non-Negotiable Quality Bars

- **Accessibility:** WCAG 2.2 Level AA. Every interactive element is
  keyboard-operable and has a visible focus state, color contrast meets AA
  against `--bg` (#0f0f0f), images have meaningful `alt` text (decorative
  images use `alt=""`), and heading levels are never skipped.
- **Core Web Vitals:** ship code that passes CWV thresholds (LCP, INP, CLS)
  at the "Good" bucket — optimize images (`next/image`), avoid layout shift
  from web fonts (use `next/font` with `display: swap` and matched
  fallback metrics), keep client-side JS minimal.
- **Semantic HTML & SEO:** use landmark elements (`header`, `nav`, `main`,
  `footer`, `section`), correct heading hierarchy, descriptive link text
  (no bare "click here"), per-page `metadata` (title/description/OG/Twitter
  card), and a sitemap + robots.txt.
- **Rendering/perf best practices:** Server Components by default; a
  component only becomes a Client Component (`"use client"`) when it needs
  interactivity, state, or a browser-only API. Push `"use client"` as far
  down the tree as possible rather than marking whole page trees client-side.
  Memoize expensive derived values, avoid unnecessary re-renders, and prefer
  CSS (including Tailwind's `:hover`/`:focus`) over JS for effects that
  don't need it.

## Design Tokens

Sourced from the Quattro-inspired design spec — defined as CSS custom
properties (via Tailwind 4 `@theme`) rather than hardcoded hex values in
components:

```css
--bg: #0f0f0f;
--surface-1: #171717;
--surface-2: #1f1f1f;
--surface-3: #262626;
--border-1: #2e2e2e;
--border-2: #363636;
--text-muted-1: #545454;
--text-muted-2: #7a7a7a;
--text-muted-3: #a8a8a8;
--text: #ffffff;
--overlay-10: rgba(255, 255, 255, 0.1);
--accent-available: <green, TBD exact hex from design>;
```

- Headline font: Inter, weight 600, ~80px / line-height ~84px / letter-spacing
  -4px desktop, scaling down responsively.
- Body/nav/button font: Inter, weight 400–500, 12–16px.
- Metadata/label font: JetBrains Mono, uppercase, letter-spaced — dates,
  tags, location, status, stack tags.
- Hierarchy within headlines is done via `--text` opacity steps (100/75/50/25%),
  never separate gray colors.

## Motion

- No scroll-triggered reveal animations — content is visible immediately on
  load.
- Text-roll hover (nav links/buttons): 3 stacked identical label copies in an
  `overflow-hidden` container, hover translates the stack.
- Work-row hover: title fades toward transparent, a cursor-following "View
  Project →" pill appears.
- General timings: ~250–350ms ease-out unless otherwise specified.
- Respect `prefers-reduced-motion`: disable/shorten non-essential motion
  (text-roll, cursor-following pill, nav pill) for users who request it —
  required for WCAG 2.2 AA (2.3.3).

## Project Structure

```
app/
  page.tsx               # home (hero, about, work, experience, services, contact)
  work/[slug]/page.tsx   # project detail pages
  blog/                  # blog index + [slug] posts (MDX)
  layout.tsx
  sitemap.ts
  robots.ts
components/
  <section>/               # one directory per page section (Hero, About, Work, ...)
lib/
  content/                 # project + post data (typed) until/unless a CMS is introduced
public/
```

Blog posts are authored as local MDX under `content/blog/` to start — no
CMS dependency unless/until the blog needs one. Keep content (copy, project
data, post frontmatter) separate from presentational components so it's easy
to swap the data source later without touching component code.

## Git Workflow

- Never commit directly to `main`. All work happens on a feature branch
  (`type/short-description`, e.g. `feat/hero-section`) and lands via a pull
  request into `main`.
- Before every push: run typecheck (`tsc --noEmit`), Biome lint, and the
  build. A branch with failing checks does not get pushed.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`), enforced by
  Commitlint via a Husky `commit-msg` hook. A Husky `pre-push` hook runs
  lint + typecheck.
- PR titles also follow Conventional Commits format.

## Deployment

Target platform is Vercel. Framework preset auto-detects Next.js; no custom
build configuration should be needed beyond standard `next build`.
