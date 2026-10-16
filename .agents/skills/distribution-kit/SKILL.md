---
name: distribution-kit
description: Draft the full distribution kit for one dainemawer.com post or TIL, covering LinkedIn post + carousel outline, Reddit posts per subreddit, Bluesky/X thread, newsletter editor pitches, internal-link suggestions, a `social` frontmatter line and UTM links. Use when asked to "distribute", "promote", "make a distribution kit", "write the LinkedIn/Reddit post for", or "get this post out there" for a post in apps/blog/content.
metadata:
  author: dainemawer (repo-local, not from skills.sh)
  argument-hint: <slug | til/slug>
---

# Distribution kit

Turns one published (or about-to-publish) post into ready-to-paste copy for every channel in the growth system. The playbooks in `apps/blog/docs/growth/` are the source of truth for each channel's rules. Read the relevant ones before drafting, and don't contradict them.

## Inputs

1. The post: `apps/blog/content/posts/<slug>.mdx` (or `content/til/<slug>.mdx`). Use `title`, `dek`, `shortAnswer`, `takeaways`, `faq`, `topics` and the body.
2. UTM links: run `pnpm --filter blog share <slug>`, and again with a placement for each subreddit (`pnpm --filter blog share <slug> reactnative`).
3. Internal links: run `pnpm --filter blog audit:links` and read this post's row and its "unlinked related pairs".

## Rules

- **Facts only from the post.** Every number, date, version and claim must appear in the post's frontmatter or body. Never invent stats, anecdotes or results. If a hook needs a story the post doesn't have, use a different hook pattern.
- **Daine's voice:** direct, specific, first person, no hype. Avoid stock AI phrasing ("delve", "game-changer", "in today's fast-paced world", "unlock", "let's dive in"), rhetorical-question chains, and emoji walls. Run the result past the `humanizer` skill's checklist.
- **Native first:** LinkedIn and threads carry the insight in the post itself; the link goes in the first comment or the last post of the thread.
- Pick channels by fit using the tables in `reddit.md` and `newsletters.md`. Not every post goes everywhere. Say which channels you're skipping and why.

## Output

Write the kit to `apps/blog/docs/growth/kits/<slug>.md` with these sections, in order:

1. **Channel plan:** a table of channel, placement, day (per the cadence in `docs/growth/README.md`) and UTM link.
2. **`social` frontmatter line:** one sentence, at most 250 characters, that makes a stranger click (used by the auto-poster). Offer to add it to the post's frontmatter.
3. **LinkedIn post:** following `linkedin.md` anatomy; the hook stays under ~200 characters; ends with a question and "link in the first comment". Include the first-comment text.
4. **LinkedIn carousel outline** (only for framework or checklist posts): 8–10 slides, one line each.
5. **Reddit:** 1–3 subreddits, each with title + body per the `reddit.md` template, adapted to that sub's audience. Use the discussion-first variant for r/ExperiencedDevs and r/EngineeringManagers.
6. **Bluesky/X thread:** 4–6 posts, each under 280 characters, link in the last post.
7. **Newsletter pitches:** which newsletters (from the `newsletters.md` table) plus the filled pitch for each, under 80 words.
8. **Internal links to add:** 2 older posts that should link to this one, each with the exact sentence to add the link to, and the new wording.
9. **Cross-post:** yes or no for dev.to/Hashnode, and the earliest date (publish date + 3–7 days).

End by telling Daine the three things to do first.
