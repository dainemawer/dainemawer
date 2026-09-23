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

## Notes

- Leave "Queued" empty (just the HTML comment above) when you don't have a
  specific idea. The pipeline falls back to its normal research pass.
- An idea here skips the "check what's trending" step but still goes through
  the duplicate-angle check against `content/posts/*.mdx`, the `ai-seo` and
  `humanizer` passes, lint, and the same branch/PR/email flow.
- This file isn't rendered on the site (only `content/posts/*.mdx` is read by
  `lib/posts.ts`), so it's safe to leave idea fragments, links, or half-formed
  notes here.
