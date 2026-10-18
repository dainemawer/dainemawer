# Pitching: podcasts, talks and guest posts

Other people's audiences grow yours faster than anything you publish yourself. A podcast episode or conference talk introduces you, with credibility, to thousands of people who already trust the host. Your posts are the raw material: each one shows what you'd talk about.

## The process (one batch a month, ~90 minutes)

1. **Pick 5 targets** from the lists below. Mix them: 3 podcasts, 1 CFP, 1 guest post or meetup.
2. **Research each one for 5 minutes.** Listen to part of a recent episode. Note the host's name, a recent guest, and what the show doesn't cover yet (your angle).
3. **Send a personalized pitch** using the templates below. Personalization is the whole game; a generic pitch is ignored.
4. **Log it** in the tracker. Follow up once after 10 days, then let it go.
5. **When you get a yes,** send a one-page brief: 3 talking points, your bio, a headshot, and links to the 2 relevant posts. Afterwards, write a short post linking the episode. It's free content and hosts love the extra promotion.

### Before the first batch: a speaking page

Add a `/speaking` page (your contact form already has a "speaking" reason): a short bio, a headshot, 3 talk topics (the abstracts below), and past appearances as they build up. Every pitch links to it. *I can build this page; it's one of the follow-ups.*

## Your three talk and episode topics

Built from posts that already perform as essays. Use the same topics for podcast pitches and CFPs.

**1. Circuit breakers, not budget caps: engineering limits for AI coding agents**
Uber and Microsoft both capped AI spend in 2026 after budgets ran out in months, but a monthly cap only catches the damage afterward. This talk borrows the circuit breaker pattern from SRE (iteration limits, per-run budget ceilings, failure thresholds) and shows where the enforcement has to live so a looping agent stops at step 40, not at the invoice. *Sources: circuit breakers, MCP context bloat, WIP limits for agents.*

**2. The verification bottleneck: leading a team where agents write the first draft**
When agents produce plausible code faster than anyone can review it, verification becomes the constraint. Covers WIP limits for agents, reviewing for intent before lines, spec-driven development as the new code review, and how to grow juniors when the work they learned on is automated. *Sources: reviewing AI code, WIP limits, spec-driven dev, junior pipeline, orchestrating agents.*

**3. One domain layer, two platforms: sharing TypeScript between Next.js and Expo**
What belongs in a shared package (types, validation, a thin API client), what never does (navigation, storage, UI), and the Metro + pnpm symlink problems you'll hit, plus getting off the legacy architecture before SDK 55 forces it. *Sources: shared TS monorepo, Expo SDK 55, React Compiler.*

## Podcast targets

Check each show is still releasing and still takes guests before pitching. Show listings change.

| Show | Fits | Angle to pitch | Notes |
| --- | --- | --- | --- |
| Frontend.fm (Maxi Ferreira) | Leadership with a frontend angle | Topic 2 | Listing says it accepts guests; twice monthly |
| PodRocket (LogRocket) | Frontend technical | Topics 1 or 3 | Often interviews authors of recent posts |
| ConTejas Code (Tejas Kumar) | React, TS, Next.js, AI | Topic 1 | Active in 2026; mixes solo and guest episodes |
| React Native Radio (Infinite Red) | React Native / Expo | Topic 3, the SDK 55 migration | Timely now |
| Dev Interrupted (LinearB) | Engineering leadership, AI productivity | Topics 1 or 2 | EM/VP audience; AI cost is on topic |
| Software Engineering Daily | Broad technical | Topic 1 | Higher bar; pitch once you have 2–3 appearances |
| Front End Happy Hour | Frontend panel | Topic 2 | Confirm it's still running |
| The Changelog / Changelog & Friends | Broad dev | Topic 1 | Get in front of them first via a Changelog News submission |

## Conference CFPs

Calls for papers for mid-2027 conferences mostly open **between November 2026 and February 2027**, so now is the time.

**This is automated:** every Monday at 07:00, `.github/workflows/cfp-scan.yml` opens a GitHub issue labelled `cfp`. It lists open calls from the confs.tech dataset that fit your topics, marked 🆕 (new this week), ⏰ (closes within 14 days) and 📍 (Africa), and closes the previous week's issue. Run it any time from the Actions tab ("Run workflow") or locally with `pnpm --filter blog cfp-scan`. The conferences below aren't reliably in that dataset, so check them by hand, along with **sessionize.com**.

| Conference | Fit | Topic |
| --- | --- | --- |
| DevConf (South Africa) | Local, broad dev | 1 or 2. Start here: home advantage, no travel |
| React Summit / JSNation (Amsterdam, GitNation) | React / JS | 3, or 1 |
| React Advanced London | React | 3 |
| Chain React (Infinite Red) | React Native | 3 |
| App.js Conf (Kraków) | React Native / Expo | 3 |
| LeadDev (London / New York / Berlin) | Engineering leadership | 2 |

Local meetups (search Meetup.com for Cape Town JavaScript, React and frontend groups) are the best rehearsal. Give the talk there first, then pitch it to conferences with the recording.

## Guest posts

Once a quarter, pitch one of your strongest angles, rewritten for that outlet, never a copy: LeadDev (leadership), Smashing Magazine (CSS: text-box-trim, if(), anchor positioning), the LogRocket blog (technical; they pay), CSS-Tricks-style outlets. Your author bio links back to the site and newsletter.

## Templates

### Podcast pitch

> Subject: Guest idea for [Show]: [topic in ~6 words]
>
> Hi [host first name],
>
> I enjoyed your episode with [recent guest] on [topic]. [One specific reaction, e.g. the point about X.]
>
> I'm a Staff Engineer at Fueled in Cape Town and write about [area] at dainemawer.com. An episode idea your listeners might like:
>
> **[Topic title]**: [2 sentences from the abstract above, adjusted to the show].
>
> A few things we could dig into:
> - [talking point with a concrete number or story]
> - [talking point]
> - [talking point]
>
> I wrote about this recently here: [tagged link, `pitch` channel]. More about me: dainemawer.com/speaking
>
> Happy to work around your schedule (I'm UTC+2).
> Daine

### Follow-up (once, after 10 days)

> Hi [name], just bumping this in case it got buried. No worries if it's not a fit right now. I also have [alternative topic] if that suits the show better.

### CFP abstract

Use the topic abstract above as the description. For "Why should we pick this talk?":

> This comes from running these patterns on a production team at Fueled, not from a demo. Attendees leave with [3 concrete takeaways]. I've written about each part in depth (links), and the talk is the practical synthesis.

## Tracker

| Date | Target | Type | Topic | Status | Follow-up date | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |
