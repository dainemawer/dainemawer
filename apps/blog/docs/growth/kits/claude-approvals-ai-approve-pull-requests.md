# Distribution kit: claude-approvals-ai-approve-pull-requests

Post: [Claude Approvals: Should AI Approve Your Pull Requests?](https://www.dainemawer.com/claude-approvals-ai-approve-pull-requests) (2026-11-27). Every fact below comes from the post.

## 1. Channel plan

| Channel | Placement | Day | Link |
| --- | --- | --- | --- |
| Bluesky/X auto-post | `social` line | On merge | auto |
| Internal links | pager-owns-agent-written-code, agent-instruction-files-are-code | Day of merge | n/a |
| LinkedIn | Text post, link in first comment | Next Tue 13:00 | https://www.dainemawer.com/claude-approvals-ai-approve-pull-requests?utm_source=linkedin&utm_medium=social&utm_campaign=claude-approvals-ai-approve-pull-requests |
| Reddit #1 | r/ClaudeAI | Next Tue 15:00 | https://www.dainemawer.com/claude-approvals-ai-approve-pull-requests?utm_source=reddit&utm_medium=community&utm_campaign=claude-approvals-ai-approve-pull-requests&utm_content=claudeai |
| Newsletters | Changelog News | Wed | https://www.dainemawer.com/claude-approvals-ai-approve-pull-requests?utm_source=changelog&utm_medium=community&utm_campaign=claude-approvals-ai-approve-pull-requests |
| Reddit #2 | r/ExperiencedDevs (discussion-first, link only if asked) | Thu | https://www.dainemawer.com/claude-approvals-ai-approve-pull-requests?utm_source=reddit&utm_medium=community&utm_campaign=claude-approvals-ai-approve-pull-requests&utm_content=experienceddevs |
| Bluesky/X thread | From takeaways | Thu | https://www.dainemawer.com/claude-approvals-ai-approve-pull-requests?utm_source=bluesky&utm_medium=social&utm_campaign=claude-approvals-ai-approve-pull-requests |
| Hacker News | Optional, only if the r/ClaudeAI post gets traction | Thu or later | https://www.dainemawer.com/claude-approvals-ai-approve-pull-requests?utm_source=hackernews&utm_medium=community&utm_campaign=claude-approvals-ai-approve-pull-requests |

Skipping: JavaScript Weekly and React Status (not a JavaScript or React post), r/EngineeringManagers (r/ExperiencedDevs covers the same discussion this week; use it next time for a leadership-first angle), dev.to/Hashnode cross-post (see section 9).

## 2. `social` frontmatter line

```yaml
social: "Claude Approvals' permissive starter policy lets an author plus a passing Claude review merge almost anything. On this site's repo, 33 of 34 merges that touched AGENTS.md, dependencies or CI would have gone through. A safer policy."
```

## 3. LinkedIn post

> Anthropic's new Claude Approvals agent can approve pull requests. The idea is sound. The permissive starter policy in its setup docs isn't.
>
> In that policy, once Claude's review passes, one person is enough, and the author counts as that person.
>
> I ran the policy's path and size rules over the 79 merged pull requests in this site's own repo. 34 touched a file that steers agents, CI or dependencies: AGENTS.md, package.json, pnpm-lock.yaml, .github/workflows. The starter would have held exactly one of them for a second person.
>
> Two lines in Anthropic's own docs explain why that matters:
> → Only policy files, REVIEW.md, CODEOWNERS and a few git files are protected by default. AGENTS.md, CLAUDE.md and .mcp.json aren't.
> → A pull request's own text can steer a classifier's answer.
>
> The rule I'd adopt: classifiers can add reviewers. They can never remove them.
>
> Let Claude approve docs and content. Keep a non-author human on code, dependencies, CI and agent instructions. Run observe mode for two weeks before you enforce anything.
>
> Which paths in your repo would you honestly let an AI approve?
>
> Link in the first comment.

**First comment:**

> The full post has a tiered `.claude/approvals.yml` you can start from, plus the GitHub settings that go with it: https://www.dainemawer.com/claude-approvals-ai-approve-pull-requests?utm_source=linkedin&utm_medium=social&utm_campaign=claude-approvals-ai-approve-pull-requests

## 4. LinkedIn carousel outline

1. Should AI approve your pull requests? Read the starter policy first.
2. Claude Approvals: a GitHub check that applies `.claude/approvals.yml` and can post an approving review.
3. Permissive starter: Code Review passes → one seat → the author fills it.
4. Protected by default: policy files, REVIEW.md, CODEOWNERS, git files. Not AGENTS.md, CLAUDE.md, .mcp.json, .github/.
5. Anthropic's docs: a pull request's text can steer a classifier's answer.
6. This site's repo: 34 of 79 merges touched agent, CI or dependency files. The starter held 1.
7. Rule: classifiers can add reviewers, never remove them.
8. Tiers: docs and content → Claude may approve. Code, deps, CI, agent files → a non-author human.
9. GitHub side: require the check from the Claude app, dismiss stale approvals, watch auto-merge.
10. Daine Mawer, full post and policy file at dainemawer.com

## 5. Reddit

**r/ClaudeAI**

> **Title:** I ran Claude Approvals' permissive starter policy rules against 79 real merged PRs. 33 of the 34 that touched AGENTS.md, deps or CI would have needed only the author.
>
> Claude Approvals (part of the Claude Ship launch) reads `.claude/approvals.yml` and can approve PRs where your policy allows it. I can't run Approvals itself without a Team org, so I applied the policy's deterministic parts (paths and diff size) to my site's monorepo history with a short script.
>
> What I found:
> - 34 of 79 merges touched an agent-control file. The biggest trigger was an app's AGENTS.md (26 merges), then package.json and pnpm-lock.yaml, then .github/workflows.
> - The permissive starter only asks for two people under `.claude/`, which caught 1 of those 34.
> - Skills live in `.agents/skills/` and are symlinked into `.claude/skills/`. Approvals protects the symlink, not the file it points to.
>
> The docs also say a PR's own text can steer a classifier's answer, so my rule is: classifiers can add reviewers, never remove them. The post has a tiered policy file (not yet validated by Approvals itself, so expect to fix a key or two).
>
> Link: https://www.dainemawer.com/claude-approvals-ai-approve-pull-requests?utm_source=reddit&utm_medium=community&utm_campaign=claude-approvals-ai-approve-pull-requests&utm_content=claudeai
>
> Has anyone running the beta seen observe mode disagree with their reviewers yet?

**r/ExperiencedDevs** (discussion-first, no link unless someone asks)

> **Title:** If an AI can approve PRs under a policy file, which paths would you actually let it approve?
>
> Anthropic's Claude Approvals now lets a team write a YAML policy: how many people each path needs, and where Claude may post an approving review. Writing one forced me to admit my real review policy had been "1 approval required" on everything.
>
> Where I landed: an AI approval is fine on docs and content, where a bad merge is a revert. Code, dependency bumps, CI workflows and agent instruction files (AGENTS.md, CLAUDE.md) keep a human who isn't the author. And a model's judgment can add reviewers but never remove them, since the PR author writes the text the model reads.
>
> The strongest counterargument I have: paths are a crude proxy for risk. A three-line auth change beats 300 lines of docs.
>
> How are your teams tiering review now that agents write a growing share of the diffs? Anyone dropped to zero human reviewers on some paths?

Link to share if asked: https://www.dainemawer.com/claude-approvals-ai-approve-pull-requests?utm_source=reddit&utm_medium=community&utm_campaign=claude-approvals-ai-approve-pull-requests&utm_content=experienceddevs

## 6. Bluesky/X thread

1. Anthropic's Claude Approvals can approve PRs under a policy file you write. Good idea. But in its permissive starter policy, once Claude's review passes, one person is enough, and the author counts as that person. 🧵
2. Protected by default: policy files, REVIEW.md, CODEOWNERS, a few git files. Not protected: AGENTS.md, CLAUDE.md, .mcp.json, .github/. Those are the files that tell your agents what to do.
3. I applied the starter's path rules to 79 merged PRs in my site's repo. 34 touched agent, CI or dependency files. The starter would have held 1 of them for a second person.
4. Anthropic's docs also warn that a PR's own text can steer a classifier's answer. So: classifiers can add reviewers. They can never remove them.
5. Tiered policy file, GitHub settings and where the argument breaks: https://www.dainemawer.com/claude-approvals-ai-approve-pull-requests?utm_source=bluesky&utm_medium=social&utm_campaign=claude-approvals-ai-approve-pull-requests

## 7. Newsletter pitches

**Changelog News** (opinion and analysis; submit at changelog.com/news/submit)

> Claude Approvals, launched 23 November, lets an AI approve pull requests under a policy file. Its permissive starter lets the author plus a passing Claude review merge almost anything, and AGENTS.md, CLAUDE.md and .mcp.json aren't protected by default. Applied to 79 real merges, the starter's rules held 1 of 34 agent, CI or dependency changes for a second person. The post argues classifiers should only ever add reviewers, and includes a tiered policy.
>
> https://www.dainemawer.com/claude-approvals-ai-approve-pull-requests?utm_source=changelog&utm_medium=community&utm_campaign=claude-approvals-ai-approve-pull-requests

## 8. Internal links to add

**pager-owns-agent-written-code.mdx**, line 58.

Current:
> Most teams define ownership by assignment. A team is listed in CODEOWNERS, a service has an owning team in the catalog, an engineer approved the PR.

New:
> Most teams define ownership by assignment. A team is listed in CODEOWNERS, a service has an owning team in the catalog, an engineer (or now [an AI under an approvals policy](/claude-approvals-ai-approve-pull-requests)) approved the PR.

**agent-instruction-files-are-code.mdx**, line 82.

Current:
> A change to an instruction file should get the same review as a change to a workflow file, because it has the same effect.

New:
> A change to an instruction file should get the same review as a change to a workflow file, because it has the same effect. If you use Claude Approvals, [it doesn't protect these files by default](/claude-approvals-ai-approve-pull-requests), so write the rule yourself.

## 9. Cross-post

No for now. It's a news-driven analysis whose numbers come from this site's own repo, and the policy file hasn't been validated by Approvals itself yet. Revisit after someone in the beta confirms the file parses. Earliest date if you change your mind: 2026-11-30 (publish date + 3 days).

## Three things to do first

1. Add the two internal links in section 8 the day this merges.
2. Post to r/ClaudeAI on Tuesday. It's the audience most likely to be in the beta and able to report whether the policy file parses.
3. Submit to Changelog News on Wednesday, while Claude Ship is still news.
