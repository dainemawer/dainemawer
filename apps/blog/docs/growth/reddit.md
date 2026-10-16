# Reddit

Reddit works when your post reads like a contribution, not an ad. Most dev subreddits remove link-drops from accounts that only post their own domain. **Read each subreddit's sidebar rules before your first post there.** They change, and I couldn't fetch them directly.

## Ground rules

1. **Warm up the account.** Before posting your own links, spend 2–3 weeks commenting helpfully in the subs below, about 15 minutes a day. Aim for roughly nine helpful comments for every self-link.
2. **Text post first, link second.** Write the useful part in the post (3–6 bullets of the actual insight), then add: "Full write-up with code: [link]". Many subs allow text posts where they'd remove a bare link.
3. **One sub per post per day.** Never post the same thing to several subs at once; Reddit's spam filter catches it. Space them 2–3 days apart and rewrite the intro for each audience.
4. **Be there for the first 2 hours.** Early replies decide whether a post rises. Answer every comment, especially the critical ones.
5. **Be open about it.** Say "I wrote this". People respect it; hiding it gets you banned.
6. **Tag links per sub:** `pnpm --filter blog share <slug> <subreddit>` → use the `reddit` line.
7. **Timing:** weekdays 14:00–17:00 in Cape Town (08:00–11:00 US Eastern).

## Where each post goes

| Subreddit | Post types that fit | Notes |
| --- | --- | --- |
| r/reactjs | React Compiler, shared TS domain layer, Storybook | Usually wants a "Resource" or similar flair; check for weekly self-promo threads |
| r/reactnative | Expo SDK 55 migration, Next.js + Expo monorepo | Very receptive to concrete migration guides |
| r/expo | Expo SDK 55 migration | Small, highly targeted |
| r/javascript | Temporal, npm worms, React Compiler | Low-effort posts get removed; lead with substance |
| r/typescript | TS 7 migration, shared domain layer | Likes the "here's where it breaks" angle |
| r/node | npm supply chain posts, Temporal in Node 26 | |
| r/css | text-box-trim, if(), anchor positioning, custom properties | Include a CodePen or screenshot if you can |
| r/Frontend | All CSS posts, Baseline | |
| r/webdev | Selectively; check whether articles are allowed outside the weekly threads | Huge but strict about self-promo |
| r/programming | Opinion and analysis: circuit breakers, MCP bloat, spec-driven dev | No tutorials; high bar, high reward |
| r/ExperiencedDevs | Junior pipeline, reviewing AI code, WIP limits | **Very low tolerance for links.** Start a discussion in text; share the link only if someone asks |
| r/EngineeringManagers | Junior pipeline, forking the EM role, FATE estimation | Discussion-first, like ExperiencedDevs |
| r/ClaudeAI, r/ChatGPTCoding, r/cursor | Circuit breakers, MCP bloat, orchestrating agents, WIP limits | Practical agent-workflow posts do well |
| r/LocalLLaMA | MCP context bloat | Technical crowd; numbers matter |
| r/netsec / r/devops | npm worm defense | Check rules; netsec is strict about original research |

## Post template

> **Title:** [the concrete claim or result, not the post title, e.g. "Expo SDK 55 removes the newArchEnabled opt-out — here's the order we migrated in on SDK 54"]
>
> [1–2 sentences of context: what happened, who it affects.]
>
> What I found:
> - [insight 1, with a number or specific detail]
> - [insight 2]
> - [insight 3]
> - [the gotcha nobody mentions]
>
> I wrote up the full version with code here: [tagged link]
>
> Curious whether anyone's hit [specific edge case], it's the one part I'm not sure about.

The closing question matters. It invites comments, and comments drive ranking.

### Discussion-first template (ExperiencedDevs, EngineeringManagers)

> **Title:** [a real question, e.g. "How are you onboarding juniors when agents now do the tasks they used to learn on?"]
>
> [3–4 paragraphs of your actual view with specifics, written so it stands alone. No link.]
>
> What's working on your teams?

If the thread takes off, reply to a relevant comment with "I went deeper on this here: [link]". Only do it once.

## Ready-to-post drafts

**r/reactnative: react-native-new-architecture-expo-sdk-55**

> **Title:** SDK 54 is the last Expo release that runs the legacy architecture. Migration order that worked for us before SDK 55
>
> Expo SDK 55 removes `newArchEnabled` from app.json completely. If a build tries to opt out, it just fails, so there's no escape hatch on the next upgrade.
>
> What I've learned so far:
> - The SDK bump isn't what breaks. A native module, a Reanimated version, or in-house native code that was never tested against Fabric and TurboModules is, because the old bridge was always there as a fallback
> - Treat it as two steps, as Expo's own guidance does: get to SDK 54 on a development build first, then turn on the New Architecture while you're still one release away from losing the option to turn it back off
> - SDK 55 also moves the default template to Native Tabs and `/src/app`, and makes Hermes v1 opt-in. Plan for those separately
>
> Full write-up with the migration order: [link]
>
> Has anyone found a library that still has no new-arch support? Curious what people did about it.

**r/css: css-text-box-trim-vertical-centering**

> **Title:** text-box-trim is Baseline now. Two properties that finally make button text look vertically centered
>
> Fonts reserve invisible space above the cap height and below the baseline (half-leading). That's why text in a button never looks centered however carefully you tune the padding.
>
> `text-box-trim` + `text-box-edge` trim that space so you align to the actual letterforms. Firefox 154 (Aug 18, 2026) completed support, so it's Baseline newly available.
>
> Write-up with before/after examples: [link]

**r/ClaudeAI: ai-agent-circuit-breakers-not-budget-caps**

> **Title:** A per-engineer AI budget cap doesn't stop one agent run looping for hours. A circuit breaker does
>
> Uber and Microsoft both capped AI coding spend this year after burning through budgets in months. A dollar cap catches the bill *afterward*. It doesn't stop a single run that's stuck in a loop right now.
>
> A run that's gone wrong doesn't throw an error. It keeps producing plausible-looking steps for as long as the budget lasts.
>
> The pattern I'd use instead is the circuit breaker from SRE: iteration limits, budget ceilings and failure thresholds, enforced inline in the layer that executes each step. Not as a prompt instruction the model can drift past once a task runs long.
>
> Full breakdown, including the four boundaries worth enforcing: [link]
>
> How are other people bounding long-running agent sessions?
