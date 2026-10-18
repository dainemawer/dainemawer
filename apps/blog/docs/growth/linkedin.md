# LinkedIn

LinkedIn is where your engineering leadership writing has the best audience: EMs, staff engineers and hiring managers. The posts that get read there are native text and document carousels. A bare link to your blog doesn't.

## What works in 2026

These are the points most sources agree on. Exact percentages vary a lot between the vendor studies, so take the specific numbers loosely.

- **Document carousels (PDF) have the strongest reach and engagement.** Use 8–10 slides, one idea per slide, and a strong hook on slide 1. Page turns count as dwell time.
- **Native text beats link posts.** Links in the post body reduce reach (estimates range from about 19% to 60%). Put the link in the **first comment**, and say "link in the first comment" in the post.
- **Dwell time and saves count for more than likes.** Write something worth saving: a checklist, a framework, a decision rule.
- **Personal profile, not a company page.**
- **Generic AI-sounding text gets pushed down.** Write it in your own voice. Use the drafts below as starting points, not finished copy.
- **Timing:** Tuesday–Thursday. 07:30–09:00 UK time reaches Europe and South Africa; 13:00–15:00 in Cape Town catches the US East Coast morning.
- **First hour:** reply to every comment. Comment on 5 posts by others in your niche just before and after you post.

## Anatomy of a post

```
[HOOK: 1–2 lines, under ~200 characters. This is all that shows before "…see more".]

[Turn: one line that sets up the tension.]

[Body: 3–6 short lines or a numbered list. One idea per line. Specific numbers.]

[Takeaway: the decision rule or reframe the reader keeps.]

[Question that invites people's own experience.]

Full write-up in the first comment.
```

### Six hook patterns that fit your writing

1. **Contrarian:** "A lower AI budget cap won't fix your AI budget problem."
2. **Specific number:** "Five MCP servers can burn 60,000 tokens before your agent reads a single message."
3. **Deadline:** "If your React Native app still runs the legacy architecture, you have one Expo release left."
4. **Named pattern:** "The tasks juniors learned on are exactly what agents now do fastest."
5. **Confession or story:** "I almost shipped a React Compiler rollout that would have silently skipped half our components."
6. **Reframe:** "Code review used to be about the code. With agents, it's about whether the code should exist."

## Formats, by post type

| Post type | Format | Example posts |
| --- | --- | --- |
| Leadership / opinion | Text post, 150–250 words | junior pipeline, forking the EM role, WIP limits |
| Framework / checklist | Carousel (8–10 slides) + short caption | reviewing AI code, circuit breakers, FATE estimation, React Compiler checklist |
| Timely technical | Text post with a deadline hook | Expo SDK 55, TS 7, Temporal, npm worms |

**Making a carousel:** each post's `takeaways` frontmatter is already a ready-made slide list. Slide 1 = hook, slides 2–7 = one takeaway each, slide 8 = "the one thing to do Monday", slide 9 = your name + "full post at dainemawer.com". Build it in Figma or Canva at 1080×1350, export to PDF, upload as a "document". The distribution-kit skill drafts the slide text.

## Weekly rhythm

- **2 posts a week**, one per new article, staggered a day after the article goes live.
- **1 carousel every 2 weeks**, from the most framework-like post.
- **15 minutes a day** commenting on posts by people in your space. On LinkedIn, comments are how new people find you.

## Ready-to-post drafts

Edit each one into your own voice before posting. Facts are taken from the posts' takeaways.

### 1. ai-agent-circuit-breakers-not-budget-caps (text)

> A lower AI budget cap won't fix your AI budget problem.
>
> Uber gave ~5,000 engineers Claude Code in December. Adoption went from 32% to 84% in four months, and the annual AI budget was gone in the same stretch. The fix: cap spend at $1,500 per engineer per month.
>
> Microsoft's Experiences and Devices division hit $500–$2,000 per user a month, then cancelled most of its internal licenses.
>
> But a monthly cap only tells you about the damage after it's done.
>
> An agent run that's gone wrong doesn't throw an error. It keeps producing plausible-looking steps for as long as the budget lasts.
>
> SRE solved this years ago with circuit breakers:
> → iteration limits
> → budget ceilings per run, not per month
> → failure thresholds
> → enforced in the layer that executes each step, not in a prompt the model can drift past
>
> Budget caps are accounting. Circuit breakers are engineering.
>
> How is your team bounding long-running agent sessions?
>
> Full write-up in the first comment.

### 2. keeping-the-junior-pipeline-alive (text)

> The tasks juniors used to learn on are exactly what AI agents now do fastest.
>
> CRUD endpoints. First-draft components. Boilerplate.
>
> The old way of learning by doing hasn't just been shortened. It's gone.
>
> What I think replaces it:
>
> 1. Redefine junior work around judgment, not typing. Auditing agent output and comparing two implementations teaches more than writing boilerplate ever did.
> 2. Protect real no-AI practice time. Skipping the struggle doesn't remove the need for debugging instinct. It just delays finding out it's missing.
> 3. Pair juniors with seniors to review agent output together. That's where craft judgment gets modeled now.
> 4. Measure learning velocity, not ticket count. Throughput is the metric AI inflates fastest and teaches least.
>
> If we stop growing juniors, we stop growing seniors in 5 years.
>
> What's working on your team?
>
> Full post in the first comment.

### 3. react-native-new-architecture-expo-sdk-55 (text, deadline hook)

> If your React Native app still runs the legacy architecture, you have one Expo release left.
>
> SDK 54 is the last one that supports it. SDK 55 removes `newArchEnabled` entirely. Set it to false and the build doesn't downgrade gracefully. It just fails.
>
> The trap: the New Architecture has been the default since SDK 53, so for two releases the migration looked optional.
>
> What actually breaks isn't the SDK bump. It's the native module, Reanimated version or in-house native code that was never tested against Fabric and TurboModules, because the old bridge was always there as a fallback.
>
> The order that works:
> 1. Get to SDK 54 on a development build
> 2. Turn on the New Architecture while you can still turn it back off
> 3. Only then upgrade to SDK 55
>
> The broader lesson is about planning. "Optional" migrations have deadlines too. They just aren't written down.
>
> Migration checklist in the first comment.

**First comment for each:** `pnpm --filter blog share <slug>` → paste the `linkedin` line, plus one sentence like "Full write-up with the checklist here:".
