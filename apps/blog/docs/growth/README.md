# Growth system

How posts get from published to read. The rule behind all of it: **spend half your writing time on distribution.** A post that ten newsletters and three subreddits pick up is worth more than three posts nobody sees.

| Doc | What it covers |
| --- | --- |
| [newsletters.md](./newsletters.md) | Dev newsletter submissions: who, how, pitch template, backlog, tracker |
| [reddit.md](./reddit.md) | Subreddits per post type, rules, templates, ready-to-post drafts |
| [linkedin.md](./linkedin.md) | Formats, hooks, carousel recipe, three ready-to-post drafts |
| [x-bluesky.md](./x-bluesky.md) | Auto-posting setup, and the two habits that actually grow an account |
| [cross-posting.md](./cross-posting.md) | dev.to / Hashnode / Medium with canonical URLs |
| [pitching.md](./pitching.md) | Podcasts, CFPs, guest posts: process, targets, templates, tracker |
| [audit.md](./audit.md) | Search, AI search and internal-link audit, with fixes |

## Tooling

| Command | Does |
| --- | --- |
| `pnpm --filter blog share <slug> [placement]` | Prints a UTM-tagged link for every channel |
| `pnpm --filter blog crosspost <slug>` | dev.to draft + paste-ready Hashnode/Medium file, canonical set |
| `pnpm --filter blog announce <slug> --dry-run` | Previews the Bluesky/X auto-post (CI runs it for real on merge) |
| `pnpm --filter blog audit:links` | Internal-link report: orphans, unlinked related posts, snippet lengths |
| Claude Code: "make a distribution kit for `<slug>`" | Drafts every channel's copy for one post (the `distribution-kit` skill) |

Reader share buttons on articles also carry UTM tags now (`utm_content=share-button`).

## Cadence: from 3 posts a week to 2 posts + 2 TILs

Three long posts a week leaves no time to distribute any of them. The new rhythm keeps output visible, and the freed-up hours go to distribution. Times are Cape Town (SAST).

| Day | Write | Distribute (30–45 min) |
| --- | --- | --- |
| **Mon** | Publish **post A** (auto-posts to Bluesky/X) | Add links to post A from 2 older posts. Run the distribution kit. |
| **Tue** | — | LinkedIn post for A (13:00). Reddit post for A, sub #1 (15:00). |
| **Wed** | Publish **TIL** | Newsletter submissions for the week (see newsletters.md). Optional: a TIL short video. |
| **Thu** | Publish **post B** | Reddit for A, sub #2, or B, sub #1. Bluesky/X thread from A's takeaways. |
| **Fri** | Publish **TIL** | LinkedIn post for B. Cross-post last week's best how-to to dev.to/Hashnode. Send the newsletter digest. |
| **Daily** | — | 15 min replying on Bluesky/LinkedIn to people in your niche. |
| **Monthly** | — | Pitch batch (pitching.md). Run `audit:links`. Review the scorecard. |

**Newsletter digest:** Resend is collecting subscribers, so send them something. A Friday email via Resend Broadcasts: this week's 2 posts and 2 TILs, plus 2–3 sentences of personal note. Subscribers who never hear from you forget why they signed up.

## Measuring it

| Metric | Where | Target by mid-January 2027 |
| --- | --- | --- |
| Newsletter subscribers | Resend → Audience (segment contact count); signups by source in GA4 or Vercel (`newsletter_signup_succeeded`) | 250+ |
| Newsletter features | newsletters.md tracker | 4+ |
| Traffic by channel | Vercel Analytics → filter by UTM source/medium | Find out which 2 channels deserve double the effort |
| Organic search clicks | Search Console → Performance | 2–3× October |
| Podcast / meetup appearances | pitching.md tracker | 2 |

Review monthly. Drop the channel that brings the fewest subscribers per hour spent, and put that time into the best one.

## One-time setup checklist

- [ ] Add `BLUESKY_HANDLE` and `BLUESKY_APP_PASSWORD` as GitHub Actions secrets (x-bluesky.md)
- [ ] Optional: X API credits and the four `X_*` secrets
- [ ] dev.to account + `DEVTO_API_KEY` in the repo-root `.env.local`
- [ ] Hashnode blog (free) and Medium account for manual cross-posts
- [ ] Mark `newsletter_signup_succeeded` as a key event in GA4
- [ ] Subscribe to JavaScript Weekly, Frontend Focus, React Status and Node Weekly (you reply to issues to submit)
- [ ] Start warming up the Reddit account (reddit.md)
- [ ] Send the newsletter backlog (newsletters.md)
