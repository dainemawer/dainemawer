# Search, AI search and internal-link audit (2026-10-16)

Re-run the internal-link part any time with `pnpm --filter blog audit:links`.

## What's already strong

- **AI search readiness is ahead of most sites.** All 32 posts have `shortAnswer`, `takeaways` and `faq` frontmatter, rendered as visible content and in the Markdown twins. You serve `llms.txt`, `llms-full.txt`, `/agents`, and Markdown content negotiation on every URL. Answer engines get clean, quotable, structured answers.
- Canonical URLs are set per post (so UTM-tagged links and syndicated copies don't create duplicates), plus a sitemap, RSS/JSON feeds, per-post OG images and JSON-LD.
- "Keep reading" related posts on every article give every post *some* inbound links at the template level.

## Findings, highest impact first

### 1. Your 10 newest posts have zero in-content inbound links

Every post from `ai-forking-engineering-manager-role` (Sep 23) onwards is linked from no other post's body. New posts link back to older ones, but nothing links forward. The newest posts are your most timely and most promotable, and the only thing pointing at them is the two-slot "Keep reading" block.

**Fix:** add 1–2 contextual links *into* each new post from older, related posts. Pairs that obviously belong together:

| Link from | To | Why |
| --- | --- | --- |
| shared-typescript-nextjs-expo-monorepo | react-native-new-architecture-expo-sdk-55 | Both Expo; the monorepo setup has to survive the SDK 55 upgrade |
| nextjs-component-library-monorepo | shared-typescript-nextjs-expo-monorepo | Same monorepo theme, three years apart |
| npm-supply-chain-trusted-publishing | npm-supply-chain-worm-defense | A two-part series that isn't linked as one |
| wip-limits-for-ai-agents, orchestrating-multiple-ai-agents | ai-agent-circuit-breakers-not-budget-caps | Agent limits, then agent failure modes |
| orchestrating-multiple-ai-agents, spec-driven-development | mcp-context-window-bloat | Agent setup cost |
| leading-with-ai, keeping-the-junior-pipeline-alive | ai-forking-engineering-manager-role | Engineering management in the AI era |
| css-if-function-safely, css-anchor-positioning-customizable-select | css-text-box-trim-vertical-centering | The modern CSS cluster |
| what-is-google-baseline | css-text-box-trim-vertical-centering, css-if-function-safely | Both posts lean on Baseline status |
| typescript-7-native-compiler-migration | react-compiler-production-checklist, temporal-api-replacing-date | "Adopting the new thing safely" cluster |

**Make it routine:** when publishing a post, add a link to it from 2 older posts in the same PR. The distribution-kit skill lists the candidates.

### 2. Build topic hubs

`/topics/<topic>` pages exist, but each only has a one-line dek. Three clusters now have enough depth to be real hub pages: a 150–300 word intro, the posts grouped into a reading order, each with a line of context.

- **AI-assisted engineering** (7 posts tagged `ai`, plus leading-with-ai and the junior pipeline post): reviewing AI code → WIP limits → orchestration → spec-driven dev → MCP bloat → circuit breakers → junior pipeline → forking the EM role
- **Modern CSS** (5 posts): Baseline → custom properties → anchor positioning → if() → text-box-trim
- **React & React Native** (5 posts): React Compiler → shared TS domain layer → Expo SDK 55 → Storybook → component library monorepo

The taxonomy gets in the way of that third hub. There's no `react` topic, so React Compiler, Storybook and the component library post are all filed under `javascript` (13 posts, a catch-all). `react-native` has only 2. Also, `npm-supply-chain-worm-defense` isn't tagged `security`, even though its companion post is. Suggested fix: add a `react` topic and retag those posts, and tag both npm posts `security`.

Hubs rank for broad terms ("AI coding agents best practices"), and AI answer engines cite them as overviews.

### 3. Snippet lengths

Google cuts titles at roughly 60 characters and rewrites descriptions outside about 70–160. Your `title` doubles as the `<title>` and `dek` as the meta description.

- **Long titles (8):** orchestrating-multiple-ai-agents (81), react-native-new-architecture-expo-sdk-55 (77), npm-supply-chain-worm-defense (70), spec-driven-development (69), ai-agent-circuit-breakers-not-budget-caps (68), css-if-function-safely (65), react-scalability-storybook (65), temporal-api-replacing-date (63). Option: add an optional `seoTitle` field for the `<title>` tag and keep the on-page headline as written.
- **Long dek:** ai-agent-circuit-breakers-not-budget-caps (243 characters). It gets truncated mid-sentence.
- **Short deks (13, mostly 2023–2024 posts):** e.g. css-custom-properties-fallbacks (34), mastering-task-estimation (39), no-code-low-code-frontend (41). Google will write its own description. Expand them to one full sentence of 120–155 characters.

### 4. Old posts are untapped

The 2023–2024 posts (code reviews, file architectures, Chrome Coverage panel, sticky elements) are evergreen search topics. A refresh pass (update facts, add `updated:` frontmatter, expand the dek, link to the 2026 posts) is often the fastest search win, because those URLs already have age.

## What I need from you to go further

- **Google Search Console:** export Performance → Search results → last 3 months, both the **Queries** and **Pages** tabs (CSV). That shows which posts already rank on page 2. Those are the cheapest wins.
- **Vercel Analytics:** the Vercel API returned "Web Analytics not found" for the `dainemawer` project in your team, so I couldn't read referrers or top pages. Either it's enabled on a different project or team, or the API needs a plan feature. A screenshot of the Analytics tab (last 30 days: top pages + referrers) works too.
