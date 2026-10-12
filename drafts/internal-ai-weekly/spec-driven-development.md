# Write the spec first: the habit that keeps AI-written code honest

*Weekly AI note · 4 min read*

## The short version

- AI agents let us write code much faster. They don't ask the clarifying questions a teammate would, so the gap between "what we asked for" and "what we meant" is easier to miss.
- Spec-driven development closes that gap. You write a short, checkable description of the work before any code exists, keep it with the code, and review the code against it.
- You can start today with a markdown file. No new tools required.

## What's changing

Most of us have felt it by now: an agent can turn a ticket into a working pull request in minutes. The part that's easy to overlook is what it does when the ticket is vague. A teammate would eventually come back with questions. An agent just picks an interpretation and builds it. The result usually looks right, passes the tests it wrote for itself, and still isn't quite what you had in mind.

There's data behind the feeling. A 2026 GitClear and GitKraken study of real commit histories found duplicated code blocks up 81% compared with 2023 (from 40.3 to 73.0 per million changed lines, as reported by [LeadDev](https://leaddev.com/ai/code-maintainability-plummets-in-the-ai-coding-era)). Code is getting written faster and revisited less, and duplication is one of the quieter ways that turns into maintenance cost later.

None of this is an argument against using agents. It's an argument for changing where we put our attention. When writing code gets cheap, the valuable part of the job moves earlier: deciding precisely what should be built.

## What a spec is (and isn't)

A spec here isn't a product requirements doc or a design file. It's a short contract that answers three questions before any code exists:

1. **What must it do?** Stated as behavior someone can check, not intent someone has to interpret.
2. **What is out of scope?** So the agent doesn't helpfully solve a neighboring problem you didn't ask about.
3. **How will we know it's done?** Ideally a list a reviewer or a test can actually verify.

If a line in the spec can't be checked, it's just a longer prompt. And if nobody could reasonably disagree with a line, it probably doesn't need to be there. Keep it small enough that people will read it.

## The new workflow

1. **Write the spec before you delegate.** An agent can draft a first version from the ticket, which is often faster than a blank page. The rule is that a person edits and approves it before implementation starts. The deciding is the valuable part: writing "handle malformed CSV rows" forces you to choose between skipping the row, failing the batch, or logging and continuing. Writing it afterwards only documents whatever the agent happened to pick.
2. **Keep the spec in the same PR as the code.** Not in a chat thread that scrolls away. When the code and the spec disagree later, that disagreement is the bug report, and you're debugging against something fixed instead of your memory of what you asked.
3. **Review the diff against the spec first.** Does the code satisfy the contract? Then: was the contract right? A clean diff that satisfies a spec that missed an edge case is still the wrong feature, and it's much cheaper to catch at the spec than three PRs later.

## Why this is an opportunity, not just a safeguard

It's easy to read this as extra process. A few things make it worth more than that:

- **It makes work delegable.** A good spec is a handoff document. It works for an agent, and just as well for a teammate picking the work up next week.
- **It speeds up review.** Reviewers get a fixed target. That's a lot easier than reading a plausible-looking diff and trying to guess what it was supposed to do.
- **It builds a skill that compounds.** Breaking a vague request into clear, checkable pieces is useful with or without AI, and it's something anyone on the team can get better at.

## Try it this week

Pick one small task you'd normally hand straight to an agent. Before you do, spend five minutes on this:

```md
## Spec: <what you're building>

**Must do**
- <behavior you can check>
- <behavior you can check>

**Out of scope**
- <the adjacent thing you don't want touched>

**Done when**
- <how a reviewer or test confirms it>
```

Commit it alongside the code. Then, when you review the result, read the spec first and the diff second. Notice what you'd have missed otherwise.

## Two ways it goes wrong

- **The spec goes stale.** Requirements shift mid-build. If the spec isn't updated with them, it's as unreliable as having none, with more false confidence attached.
- **"Good spec" turns into "lighter review."** It doesn't. The review checks something different (does this meet the contract, and was the contract right), but a person still has to check both.

Specs can also grow into twelve-page documents nobody reads. If it takes longer to review than the code it produces, trim it.

## Tools that can help

If you'd rather not start from a blank page, Matt Pocock's open-source [agent skills](https://github.com/mattpocock/skills) cover this workflow well:

- **[grill-me](https://github.com/mattpocock/skills/blob/main/skills/productivity/grill-me/SKILL.md)** interviews you about a plan until the open decisions are resolved. It's a good way to sharpen a spec before you write it down.
- **[to-spec](https://github.com/mattpocock/skills/tree/main/skills/engineering/to-spec)** turns the conversation into a spec and publishes it to your issue tracker.
- **[to-tickets](https://github.com/mattpocock/skills/tree/main/skills/engineering/to-tickets)** breaks a spec into small tickets you can hand out one at a time.
- **[code-review](https://github.com/mattpocock/skills/tree/main/skills/engineering/code-review)** reviews the diff against the originating spec, which is the review habit described above.

In Claude Code, install them with `claude plugin install mattpocock-skills@claude-plugins-official`, then run `/setup-matt-pocock-skills` once per repo, since `to-spec` and `to-tickets` publish to your issue tracker. Steps for other agents are in the repo's README.

---

*Adapted from a longer post on [dainemawer.com](https://www.dainemawer.com/spec-driven-development).*
