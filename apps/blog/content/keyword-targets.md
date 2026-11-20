# Keyword targets

The search queries the content pipeline writes toward. This file is maintained
from an interactive session with the OpenSEO MCP (the scheduled routine can't
call it). It isn't rendered on the site.

- **Last refreshed:** 2026-11-20
- **Market:** United States (OpenSEO location 2840, English). The OpenSEO
  project defaults to South Africa, so research calls must override it.
- **Source:** OpenSEO `research_keywords` (seeds: `ai code review`,
  `engineering manager ai`) plus Search Console for the last 3 months.
- Volume is monthly US searches. KD is keyword difficulty (0-100); the site is
  small, so KD under about 35 is realistic and under 20 is the sweet spot.

## How the pipeline uses this file

1. Every post targets one **primary query** from the tables below (or, for a
   breaking SIGNAL story, the query people will type about it).
2. The primary query, in natural words, goes in the title, the `shortAnswer`
   and at least one H2. The angle and opinion go in the dek and the body.
3. When a post ships against a row, set its **Status** to the post slug in the
   same PR.
4. Rows marked `covered` are already served by an existing post. Don't target
   them again; improve that post instead (see "Refresh, don't rewrite").

## Open targets

| Cluster | Primary query | Vol | KD | Secondary queries | Status |
| --- | --- | --- | --- | --- | --- |
| AI code review tools | ai code review tools | 590 | 29 | best ai code review tools (140/17), best ai code review (110/10), github ai code review (110/18), claude ai code review (40/11), cursor ai code review (20/6) | open |
| AI for coding | best ai for coding | 9,900 | 20 | best ai model for coding (1,000/32), which ai is best for coding (1,000/29) | open |
| Career anxiety | will ai replace software engineers | 1,300 | 28 | will software engineers be replaced by ai (720/18), will ai replace programmers (480/18) | open |
| Becoming an AI engineer | how to become an ai engineer | 1,300 | 8 | ai engineer roadmap (720/17), what does an ai engineer do (590/9), ai software engineer (1,600/7) | open: check search intent first; "AI engineer" often means building AI products, not using agents |
| AI-era interviews | ai engineer interview questions | 390 | 0 | ai interview questions (480/6) | open: angle must differ from agent-pull-request-interview |
| News spike | amazon mandating ai code review | 8,100 | 0 | amazon ai code review (10) | SIGNAL candidate: verify the story is current before using |

## Covered (refresh, don't rewrite)

| Primary query | Vol | KD | Existing post | Current position | Suggested fix |
| --- | --- | --- | --- | --- | --- |
| ai code review / how to review ai generated code | 1,300 / 30 | 33 / n/a | reviewing-ai-generated-code | ~28-50 | Retitle around "how to review AI-generated code", add a checklist H2 and a fresh date |
| spec driven development ai | 1,000 | n/a | spec-driven-development | not ranking | Add "AI" and "agents" to the title and short answer, plus a template |
| ai engineering manager | 7 impressions | n/a | ai-forking-engineering-manager-role | ~8.7 | Already the best AI post for search; leave the title, add internal links to it |

## Low-value queries (don't chase)

- `engineering manager ai`, `ai for engineering managers`: about 10 searches a
  month. Leadership angles are fine as the body of a post, but don't make them
  the search target.
