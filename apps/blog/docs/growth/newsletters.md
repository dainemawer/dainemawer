# Dev newsletter submissions

One newsletter feature can send more readers than a month of search traffic, and those readers subscribe. Your topics (modern CSS, React, React Native/Expo, TypeScript, npm security, AI-assisted engineering) are what these editors look for.

## What I could and couldn't verify (October 2026)

Most of these newsletters **don't publish a submission form**. Their editors find links in RSS feeds, Hacker News, Reddit, Bluesky and their inboxes. So the process has two parts: **pitch directly** where you can, and **be visible where editors look**. Routes marked *try and confirm* are my best information. Note in the tracker below what actually worked.

| Newsletter | Audience | Fits | Route | Confidence |
| --- | --- | --- | --- | --- |
| JavaScript Weekly (Cooperpress) | ~169k | Temporal, TS 7, npm worms, React Compiler | Reply to an issue email with the link and one line on why it matters | Try and confirm |
| Frontend Focus (Cooperpress) | ~71k | CSS (text-box-trim, if(), anchor positioning), Baseline | Same: reply to an issue | Try and confirm |
| React Status (Cooperpress) | ~40k | React Compiler, Expo SDK 55, Next.js + Expo monorepo | Same: reply to an issue | Try and confirm |
| Node Weekly (Cooperpress) | — | npm supply chain posts, Temporal in Node 26 | Same: reply to an issue | Try and confirm |
| This Week in React (Sébastien Lorber) | Large; has a React Native section | Expo SDK 55, React Compiler, shared TS domain layer | Mention or DM him on Bluesky/X with the link; the site also has a Discord | Try and confirm |
| CSS Weekly (Zoran Jambor) | — | All CSS posts | Contact form at css-weekly.com/contact | Form exists |
| Changelog News | — | Opinion and analysis: circuit breakers, MCP context bloat, junior pipeline, spec-driven dev | changelog.com/news/submit (sign in). **Doesn't want how-tos or tutorials** | Verified |
| Echo JS | Small but read by editors | Any JavaScript post | echojs.com → submit (needs an account) | Verified |
| Hacker News | Huge, unpredictable | Your best 1–2 posts a month (see below) | news.ycombinator.com/submit | Verified |

**Skip:** Bytes (no submissions, sponsor-only), TLDR Web Dev (merged into TLDR Dev; no public submission route), daily.dev as a *source* (it doesn't accept personal blogs). You can still share posts into daily.dev Squads as a member.

## The weekly process (~30 minutes, Wednesdays)

1. **Pick.** From this week's posts, pick the ones that pass the editor test: *would a busy senior dev click this from a one-line blurb?* Timely ("X shipped, here's how to adopt it") and contrarian ("everyone's doing X; it's wrong because…") posts pass. Evergreen basics don't.
2. **Match.** Use the table above. One post can go to 2–3 newsletters, but don't send the same post to all of them.
3. **Send.** Use the template below. Run `pnpm --filter blog share <slug> <newsletter-name>` for the tagged link (`pitch` channel).
4. **Log.** Add a row to the tracker at the bottom. Check the next 2 issues for a feature, and the `utm_source` in Vercel Analytics.
5. **Amplify where editors look.** The same day, post the link to Bluesky (the auto-poster does this) and, if the post fits, to Reddit or Echo JS. Editors pick up a lot from those places.

### Pitch template (reply to an issue, or a contact form)

> Subject: Link for [Newsletter]: [post title]
>
> Hi [editor first name],
>
> Thought this might fit a future issue: **[post title]**
> [tagged link]
>
> [One sentence on what's new or useful. Lead with the fact, e.g. "Expo SDK 55 removes the newArchEnabled opt-out entirely, so this is the migration order that works on SDK 54 before the upgrade forces it."]
>
> Thanks for the newsletter, I read it every week.
> Daine

Keep it under 80 words. Don't write a pitch deck. Editors skim hundreds of these.

### Bluesky/X mention template (This Week in React, editors who curate in public)

> @[handle] wrote up the migration order for getting off React Native's legacy architecture before Expo SDK 55 removes the escape hatch. Might be useful for the RN section: [link]

## Backlog: send these now

These posts are recent enough to still count as news.

| Post | Send to | Angle (one line for the pitch) |
| --- | --- | --- |
| react-native-new-architecture-expo-sdk-55 | This Week in React, React Status | SDK 55 removes `newArchEnabled`; migrate on SDK 54 while you still can |
| react-compiler-production-checklist | React Status, This Week in React, JavaScript Weekly | Rollout order that stops the compiler's silent skips becoming regressions |
| shared-typescript-nextjs-expo-monorepo | This Week in React, React Status | What to share between Next.js and Expo, and the Metro + pnpm symlink fixes |
| npm-supply-chain-worm-defense | Node Weekly, JavaScript Weekly | Concrete playbook against Shai-Hulud-style worms |
| css-text-box-trim-vertical-centering | Frontend Focus, CSS Weekly | text-box-trim reached Baseline newly available in August 2026 |
| ai-agent-circuit-breakers-not-budget-caps | Changelog News | Dollar caps catch the bill afterward; circuit breakers stop the runaway run |
| mcp-context-window-bloat | Changelog News | Five MCP servers can spend 30–60k tokens before the agent reads a message |
| temporal-api-replacing-date | JavaScript Weekly, Node Weekly | Temporal is unflagged in Node 26; how to migrate at the boundaries |

## Hacker News rules of thumb

- Submit the original URL with the post's own title. HN strips UTM-looking parameters anyway, and editorialized titles get flagged.
- Weekday mornings US Eastern (14:00–16:00 in Cape Town) are the usual sweet spot.
- Opinionated, well-sourced posts do best: circuit breakers, MCP bloat, junior pipeline, npm trust model. CSS how-tos rarely land.
- If it makes the front page, stay in the thread for two hours and answer questions with substance. Don't get defensive.
- Max one submission a week. HN penalizes accounts that only submit their own domain, so upvote and comment on other things too.

## Tracker

| Date | Post | Newsletter | Route | Featured? (issue #) | Visits (Vercel, utm) |
| --- | --- | --- | --- | --- | --- |
| | | | | | |
