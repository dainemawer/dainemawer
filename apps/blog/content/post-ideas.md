# Post ideas queue

Manual override for the scheduled content pipeline. If this file has at least
one uncommented idea under "Queued", the next run uses the first one instead
of doing its own research and topic selection.

## How to add an idea

Add a line under "Queued" in this form:

```
- <topic/angle in a sentence or two> [optional: rough slug, links, notes]
```

One idea per line. The pipeline takes the first line, drafts the post, opens
the PR, then removes that line from this file as part of the same commit.
Everything else in the queue stays for next time.

## Queued

<!-- - Example: CSS anchor positioning now that Safari shipped it — compare against the old popover + JS approach. -->

- BUILD: the best AI code review tools, tested on the same pull request. Plant three or four real bugs (a logic error, a security issue, a missing edge case, a style nit) in one small PR, run it through every AI reviewer available in the run (for example Claude Code's review, GitHub Copilot review, an open-source review action), and publish a table of what each one caught, missed and falsely flagged. [target: ai code review tools] [topics: ai]
- BUILD: the best AI for coding depends on the task. Run the same three small tasks (a bug fix, a refactor, a new feature with tests) through at least two models or agent setups available in the run, and report pass rates, time, cost and diff size. Pick a winner per task, not overall. [target: best ai for coding] [topics: ai]
- Will AI replace software engineers? Answer it from the staff/EM seat: which parts of the job agents already do, which parts got more valuable, and what an engineer should do about it this year. Ground it in recent research (METR, DORA, Stack Overflow survey) and link keeping-the-junior-pipeline-alive. [target: will ai replace software engineers] [topics: ai, staff-engineering]
- How to become an AI engineer coming from frontend or mobile: the skills that transfer, the ones that don't, and a 90-day roadmap. Check the search results first; if "AI engineer" mostly means ML research roles, narrow the angle to "AI product engineer" and say so. [target: how to become an ai engineer] [topics: ai]

## Parked

Older technique ideas. They have no keyword target yet, so the pipeline skips this section.

- Testing a React Native app when your habits come from Next.js: what Jest, React Native Testing Library and Maestro each catch, and what to stop testing. [topics: react-native]
- Ten browser assumptions that break in a web developer's first month with React Native: no cascade, layout differences, lists, navigation state, and platform-specific behavior. [topics: react-native]
- Authentication shared between a Next.js app and an Expo app: cookies versus tokens, secure storage on device, refresh handling, and where the two flows have to differ. [topics: react-native, javascript]

## Notes

- `[target: ...]` names the primary search query from `content/keyword-targets.md`. It goes in the title, the short answer and an H2.
- The pipeline must not invent anecdotes, named projects or claimed experience. If you have a real story that fits an idea (for example from the React Native app you lead), append it to that line as `[notes: ...]` and the draft can build on it.

- Leave "Queued" empty (just the HTML comment above) when you don't have a
  specific idea. The pipeline falls back to its normal research pass.
- An idea here skips the "check what's trending" step but still goes through
  the duplicate-angle check against `content/posts/*.mdx`, the `ai-seo` and
  `humanizer` passes, lint, and the same branch/PR/email flow.
- This file isn't rendered on the site (only `content/posts/*.mdx` is read by
  `lib/posts.ts`), so it's safe to leave idea fragments, links, or half-formed
  notes here.
