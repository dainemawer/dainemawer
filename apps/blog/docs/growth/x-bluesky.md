# X and Bluesky

The "tweeting into a void" feeling is real: on both networks, a new account posting links to its own blog reaches almost nobody. Automation handles the posting so you stay present without effort. Growth comes from the two habits below, not from the automated posts.

## What's automated (already built)

`.github/workflows/announce.yml` runs whenever a new post or TIL merges to `main`:

1. Waits for Vercel to serve the page (polls until it returns 200, up to 10 minutes).
2. Posts to **Bluesky** with a link card using the post's OG image.
3. Posts to **X** with the link, if X credentials are set.

The text is the post's `social` frontmatter field if you add one, otherwise its dek. TILs are prefixed "TIL:". Links carry `utm_content=auto` so you can see in Vercel Analytics what auto-posts bring in. Editing an existing post never re-announces it.

### One-time setup

**Bluesky (free):**
1. bsky.app → Settings → Privacy and security → App passwords → create one named "blog-announce".
2. GitHub repo → Settings → Secrets and variables → Actions → add `BLUESKY_HANDLE` (`dainemawer.com`) and `BLUESKY_APP_PASSWORD`.

**X (optional; pay-per-use):** X has had no free write tier for new developers since February 2026. Credits cost roughly $0.015 per post, or $0.20 per post containing a link. At your cadence that's about $2–3 a month.
1. console.x.com → create an app → User authentication settings → Read and write.
2. Generate the API key/secret and the access token/secret for your own account.
3. Add `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET` as repo secrets, and add a few dollars of credit.

Test locally first: `pnpm --filter blog announce <slug> --dry-run`.

## Where to focus: Bluesky first

A large part of the frontend and web-platform community (CSS people, browser engineers, React and RN folks) now posts mainly on Bluesky, and its feeds aren't dominated by an engagement algorithm. That suits your content better than X. Treat X as a mirror.

- Join the frontend/web dev starter packs and follow everyone in them who posts regularly.
- Pin a post that says who you are and links the newsletter.
- Use custom feeds (search "Frontend", "CSS", "React Native") so your replies land in the conversations those feeds surface.

## The two habits that actually grow an account

**1. Reply, don't broadcast (15 minutes a day).** Pick 20 accounts in your niche: Expo/RN team members, CSS/web platform people, TS team, AI-engineering writers. Leave one substantive reply a day on their posts, with a real data point or experience. Replies on bigger accounts are how strangers find you. This does more than everything else here combined.

**2. One native thread a week.** Pick the week's best post and turn its `takeaways` into a 4–6 post thread: hook, one takeaway per post, then "full write-up" with the link in the **last** post, not the first. The distribution-kit skill drafts this. Post manually, or schedule it in a tool like Typefully or Buffer if you'd rather batch.

## What to post besides links

- TIL screenshots (a code snippet image does better than a link)
- One-line opinions from your posts ("Budget caps are accounting. Circuit breakers are engineering.")
- Short screen-recorded clips once you start the TIL shorts
