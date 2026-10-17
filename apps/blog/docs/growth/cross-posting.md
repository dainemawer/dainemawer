# Cross-posting to dev.to, Hashnode and Medium

## Do posts need reformatting?

Mostly no. The writing stays the same. Three mechanical changes help, and `scripts/crosspost.mts` makes all three:

1. **Lead with the TL;DR.** Readers there browse a feed and decide in two lines. The script prepends the post's `shortAnswer` as a bold TL;DR.
2. **Absolute links.** Root-relative links like `/effective-code-reviews` would point at dev.to. The script rewrites them to dainemawer.com, which also sends readers back to your site.
3. **A closing CTA.** An "Originally published at…" line plus a UTM-tagged newsletter link. Subscribers are the point of cross-posting.

Optional, by hand: dev.to responds to direct "How to…" titles. Your titles are mostly that already, so only change one if it's clever rather than clear.

## Canonical URLs (what protects your SEO)

Every copy must declare dainemawer.com as the canonical URL. Then Google credits your site and treats the copy as syndication, not duplicate content.

- **dev.to:** the script sets `canonical_url` through the API.
- **Hashnode:** in the editor, under article settings, turn on "Are you republishing?" and paste the canonical URL the script prints. (Hashnode's API has required a paid Pro plan since May 2026, so this step is manual.)
- **Medium:** use medium.com/p/import with the post URL. The importer sets the canonical automatically.

**Wait 3–7 days** after a post goes live before publishing copies, so Google indexes the original first.

## Process (Fridays, 10 minutes)

1. Pick last week's best tutorial-style post. How-tos do best on dev.to and Hashnode; leadership pieces do better on LinkedIn and Medium.
2. `DEVTO_API_KEY=… pnpm --filter blog crosspost <slug>`. This creates an **unpublished** dev.to draft and writes `apps/blog/.crosspost/<slug>.md` (gitignored).
3. Review the dev.to draft (tags are mapped from topics, maximum 4), then publish.
4. Paste the `.md` file into Hashnode and set the canonical URL, or run it through the Medium importer.
5. Reply to comments there for the first day. The dev.to feed rewards discussion.

Get a dev.to API key at dev.to/settings/extensions. Put it in the repo-root `.env.local` (already gitignored, and loaded by the script) or export it in your shell.
