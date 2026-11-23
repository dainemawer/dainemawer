# Distribution kit: react-native-testing-jest-rntl-maestro

Post: [React Native Testing: What Jest, RNTL and Maestro Each Catch](https://www.dainemawer.com/react-native-testing-jest-rntl-maestro) (2026-11-23). Every fact below comes from the post.

## 1. Channel plan

| Channel | Placement | Day | Link |
| --- | --- | --- | --- |
| Bluesky/X auto-post | `social` line | Mon (on merge) | auto |
| Internal links | expo-router-vs-nextjs-app-router, core-web-vitals-mobile-app-equivalents | Mon | n/a |
| LinkedIn | Text post, link in first comment | Tue 13:00 | https://www.dainemawer.com/react-native-testing-jest-rntl-maestro?utm_source=linkedin&utm_medium=social&utm_campaign=react-native-testing-jest-rntl-maestro |
| Reddit #1 | r/reactnative | Tue 15:00 | https://www.dainemawer.com/react-native-testing-jest-rntl-maestro?utm_source=reddit&utm_medium=community&utm_campaign=react-native-testing-jest-rntl-maestro&utm_content=reactnative |
| Newsletters | React Status, This Week in React | Wed | https://www.dainemawer.com/react-native-testing-jest-rntl-maestro?utm_source=newsletter&utm_medium=email&utm_campaign=react-native-testing-jest-rntl-maestro |
| Reddit #2 | r/ClaudeAI | Thu | https://www.dainemawer.com/react-native-testing-jest-rntl-maestro?utm_source=reddit&utm_medium=community&utm_campaign=react-native-testing-jest-rntl-maestro&utm_content=claudeai |
| Bluesky/X thread | From takeaways | Thu | https://www.dainemawer.com/react-native-testing-jest-rntl-maestro?utm_source=bluesky&utm_medium=social&utm_campaign=react-native-testing-jest-rntl-maestro |
| dev.to / Hashnode | Cross-post, canonical set | From Thu 26 Nov | devto / hashnode links from `pnpm --filter blog share` |

Skipping: r/ExperiencedDevs and r/EngineeringManagers (this is a hands-on testing post, not a leadership discussion), Changelog News (it's partly a how-to), Hacker News (save for a stronger month).

## 2. `social` frontmatter line

```yaml
social: "I wrote six Jest and RNTL tests against an Expo app with two real bugs. All six passed, including two that pressed a button hidden under an overlay. What each React Native test layer can and can't see."
```

## 3. LinkedIn post

> I wrote six React Native tests against code with real bugs in it. All six passed.
>
> Two of them pressed a "Pay now" button that sits under a full-screen overlay. On a phone, nobody can tap it. React Native Testing Library pressed it anyway, with fireEvent and with userEvent, because it has no layout.
>
> Another showed the jest-expo SecureStore mock returning undefined where a device returns null. A signed-in check written for the device reported a signed-in user with an empty store.
>
> If you come from Next.js, this is the habit to drop. jsdom is a fake browser, but a fairly complete one. React Native's Jest setup has no equivalent: native modules are mocks and nothing has a position on screen.
>
> It gets worse when agents write the code and the tests. A test that mocks a native module, written by the same agent that wrote the code, checks the agent's assumption twice.
>
> What I'd do:
> → Jest for pure logic
> → RNTL for component behavior
> → Stop counting snapshots and native-mock tests as coverage
> → Gate merges on 5–10 Maestro flows on a real build
>
> What's in your React Native test suite that you'd delete tomorrow?
>
> Link in the first comment.

**First comment:**

> Full write-up, with the probe code and a table of all six results: https://www.dainemawer.com/react-native-testing-jest-rntl-maestro?utm_source=linkedin&utm_medium=social&utm_campaign=react-native-testing-jest-rntl-maestro

## 4. LinkedIn carousel outline

Optional, the policy list works as one.

1. Six React Native tests. Two real bugs. All six passed.
2. Jest + jest-expo: native Expo modules are mocks. Async calls resolve to undefined.
3. RNTL: no layout. It pressed a button hidden under an overlay.
4. Snapshots: recorded the overlay as correct.
5. Jest does catch what's decided in JavaScript, like SecureStore's key check.
6. Maestro: drives a real build through the real view hierarchy.
7. Agents: a mock and the code written by the same agent check one assumption twice.
8. Policy: Jest for logic, RNTL for behavior, Maestro gates merges.
9. Daine Mawer, full post at dainemawer.com

## 5. Reddit

**r/reactnative**

> **Title:** Six Jest/RNTL tests against an Expo SDK 58 app with two real bugs. All six passed.
>
> I set up a throwaway project (expo 58.0.26, RN 0.88.1, jest-expo 58.0.15, RNTL 14.1.0) to check how much a green Jest run tells you, coming from Next.js habits.
>
> What I found:
> - The jest-expo SecureStore mock accepts a write and reads back `undefined`. A device returns `null` for a missing key, so a `!== null` signed-in check says "signed in" with an empty store
> - `fireEvent.press` and `userEvent.press` both pressed a button covered by a full-screen absolute View with no `pointerEvents="none"`. RNTL has no layout, and its own docs say tests don't execute native code
> - A snapshot recorded the overlay without complaint
> - Jest did catch an invalid SecureStore key, because that check runs in JavaScript. That's the line: JS-side decisions are testable, platform-side ones are a mock's opinion
> - RNTL 14 made `render`, `fireEvent` and `act` async. My first draft, written the v13 way, had three of six tests fail
>
> Write-up with the probe and the testing policy I'd use: [link]
>
> I didn't have a simulator for this run, so no Maestro output. Curious whether people gate PRs on Maestro, and how many flows before CI time becomes the problem.

**r/ClaudeAI**

> **Title:** When an agent writes your React Native tests, it mostly tests its own mocks
>
> Under jest-expo, native Expo modules are generated mocks. In a quick probe, SecureStore read back `undefined` after a save. The cheapest agent fix for that is a hand-written in-memory mock, which then encodes the same belief about SecureStore as the code under test. If the belief is wrong, both are wrong together.
>
> What I'd do instead:
> - Keep Jest for pure logic, RNTL for component behavior
> - Gate merges on a short Maestro suite. The Maestro CLI bundles an MCP server (`claude mcp add maestro -- maestro mcp`), so the agent can boot a simulator, write a flow and run it in its own loop
> - RNTL 14 ships `docs/guides/llm-guidelines.md` in the package. Point the agent at it from AGENTS.md or CLAUDE.md, because v14 made render async and v13-style tests fail
>
> Probe results and code: [link]
>
> Anyone running Maestro MCP in a CI loop yet?

## 6. Bluesky/X thread

1. I wrote six Jest + React Native Testing Library tests against Expo SDK 58 code with real bugs in it. All six passed.
2. RNTL pressed a "Pay now" button hidden under a full-screen overlay, with fireEvent and userEvent. It has no layout. A snapshot recorded the overlay as correct.
3. The jest-expo SecureStore mock reads back undefined after a save. A device returns null for a missing key. A signed-in check written for the device said "signed in" with an empty store.
4. Rule of thumb: anything decided in JavaScript, Jest can test. Anything decided by the platform is a mock's opinion.
5. With agents: Jest for logic, RNTL for behavior, no credit for snapshots or native-mock tests, and gate merges on 5–10 Maestro flows on a real build.
6. Full post, with the probe code and all six results: https://www.dainemawer.com/react-native-testing-jest-rntl-maestro?utm_source=bluesky&utm_medium=social&utm_campaign=react-native-testing-jest-rntl-maestro

## 7. Newsletter pitches

**React Status** (reply to an issue email):

> A React Native testing post with a small reproducible probe: on Expo SDK 58 with RNTL 14, six Jest tests passed against code with real bugs, including two that pressed a button hidden under an overlay. It maps Jest, RNTL and Maestro to what each can see, and argues for gating agent-written PRs on Maestro flows. [newsletter link]

**This Week in React** (Bluesky/X mention or DM to Sébastien Lorber):

> For the RN section: a probe of what Jest + RNTL 14 can't see on Expo SDK 58 (mocked native modules, no layout), with results for all six tests and a testing policy for teams where agents write the code. [newsletter link]

## 8. Internal links to add

1. **expo-router-vs-nextjs-app-router.mdx**, line 136.
   - Now: `5. Test every deep link from a cold start, with and without a signed-in user, and set an `anchor` anywhere the back button disappears.`
   - New: `5. Test every deep link from a cold start, with and without a signed-in user, in an [end-to-end flow on a real build](/react-native-testing-jest-rntl-maestro) rather than a Jest test, and set an `anchor` anywhere the back button disappears.`
2. **core-web-vitals-mobile-app-equivalents.mdx**, the INP row of the contract table (line 60).
   - Now: `Scripted taps on the three busiest screens with Maestro, read entries in DevTools`
   - New: `Scripted taps on the three busiest screens with [Maestro](/react-native-testing-jest-rntl-maestro), read entries in DevTools`

## 9. Cross-post

Yes, dev.to and Hashnode, from 2026-11-26 (publish + 3 days). Run `pnpm --filter blog crosspost react-native-testing-jest-rntl-maestro`.

## Do these three first

1. Add the two internal links in section 8, so the post isn't an orphan.
2. Post the r/reactnative draft on Tuesday at 15:00.
3. Send the React Status reply and the This Week in React mention on Wednesday.
