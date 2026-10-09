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

- Sharing one TypeScript domain layer (types, validation schemas, API client) between a Next.js app and an Expo app in a pnpm and Turborepo monorepo: what is worth sharing, what never should be, and the Metro and pnpm symlink problems to expect. [slug: shared-typescript-nextjs-expo-monorepo; topics: react-native, javascript; add a `react-native` topic ("React Native & Expo") to lib/topics.ts]
- Expo Router versus the Next.js App Router, as a translation guide for web developers: layouts, dynamic routes, data loading, deep links and navigation state, and where the mental models stop matching. [topics: react-native]
- Working out why a React Native screen re-rendered: a debugging workflow using the React DevTools Profiler and the React Compiler, plus a checklist of the usual causes. [topics: react-native, javascript]
- Shipping React Native when you can't hotfix a binary: EAS Update, staged rollouts, and the line between what can go over the air and what needs a store release. [topics: react-native]
- Core Web Vitals instincts applied to a mobile app: which web metrics have a native equivalent (startup time, interaction latency, dropped frames) and how to measure each one. [topics: react-native, performance]
- Design tokens shared across web and native: one source of truth feeding Tailwind and NativeWind or StyleSheet, and the places the abstraction breaks. [topics: react-native, css]
- Testing a React Native app when your habits come from Next.js: what Jest, React Native Testing Library and Maestro each catch, and what to stop testing. [topics: react-native]
- Ten browser assumptions that break in a web developer's first month with React Native: no cascade, layout differences, lists, navigation state, and platform-specific behavior. [topics: react-native]
- Authentication shared between a Next.js app and an Expo app: cookies versus tokens, secure storage on device, refresh handling, and where the two flows have to differ. [topics: react-native, javascript]

## Notes

- The queued ideas above are written as technique and framework angles on purpose: the pipeline must not invent anecdotes, named projects or claimed experience. If you have a real story that fits one (for example from the React Native app you lead), append it to that line as `[notes: ...]` and the draft can build on it.

- Leave "Queued" empty (just the HTML comment above) when you don't have a
  specific idea. The pipeline falls back to its normal research pass.
- An idea here skips the "check what's trending" step but still goes through
  the duplicate-angle check against `content/posts/*.mdx`, the `ai-seo` and
  `humanizer` passes, lint, and the same branch/PR/email flow.
- This file isn't rendered on the site (only `content/posts/*.mdx` is read by
  `lib/posts.ts`), so it's safe to leave idea fragments, links, or half-formed
  notes here.
