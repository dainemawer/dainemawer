# Tracking Plan — dainemawer.com

Tools: Google Tag Manager (container) + Google Analytics 4 (a tag inside that container). GA4 is never called directly from the app — everything routes through GTM so tags/triggers can change without a deploy.

## What's left for you to do

1. Create a GTM container at tagmanager.google.com — copy the container ID (`GTM-XXXXXXX`).
2. Create a GA4 property, then add a "GA4 Configuration" tag inside GTM pointing at it, firing on "All Pages".
3. Set `NEXT_PUBLIC_GTM_ID` to that container ID in `.env.local` and in Vercel's Production + Preview env vars.
4. Redeploy. The CSP and script loading below activate automatically the moment the var exists — nothing else to flip.
5. Validate with GTM Preview mode and GA4 DebugView before publishing the container version live.

## How it's already wired

- [components/analytics.tsx](../components/analytics.tsx) — renders nothing until `NEXT_PUBLIC_GTM_ID` is set. Once set, it loads [public/gtm-init.js](../public/gtm-init.js) (the `dataLayer` bootstrap, served same-origin so it needs no CSP nonce or hash) followed by `gtm.js` from Google.
- [next.config.ts](../next.config.ts) — the CSP only opens up for `googletagmanager.com` / `google-analytics.com` when a GTM ID is present. With no ID set, the policy is exactly as strict as before this change.
- [lib/analytics.ts](../lib/analytics.ts) — `trackEvent(name, params)` helper for pushing to the dataLayer from any client component. No-ops safely if GTM hasn't loaded, so call sites never need to guard for that.
- Static rendering is untouched — this deliberately avoids nonce-based CSP (which would force every page to render dynamically per request) by keeping the bootstrap script same-origin instead of inline.

## Event naming convention

`object_action`, lowercase with underscores — e.g. `newsletter_signup_submitted`. Keep properties out of the event name (`location`, `topic`, etc. go in properties, not baked into the string).

## Tracking plan

| Event | Trigger | Properties | Component | Status |
|---|---|---|---|---|
| `newsletter_modal_opened` | Subscribe modal opens | `location` (nav / inline CTA) | `subscribe-modal-context.tsx` | Not wired |
| `newsletter_signup_submitted` | Form submitted, passes client validation | — | `subscribe-modal.tsx` | Not wired |
| `newsletter_signup_succeeded` | Provider confirms the subscription | — | `subscribe-modal.tsx` | Not wired — provider itself is still a TODO stub |
| `newsletter_signup_failed` | Client validation fails | `reason: "invalid_email"` | `subscribe-modal.tsx` | Not wired |
| `command_palette_opened` | ⌘K or the Search trigger clicked | `source: "shortcut" \| "click"` | `search-trigger.tsx`, `command-palette-context.tsx` | Not wired |
| `site_search` | Query entered in the command palette (debounced, not per keystroke) | `search_term`, `result_count` | `command-palette.tsx` | Not wired |
| `code_block_copied` | "Copy" clicked on a code sample | `post_slug` | `code-block.tsx` | Not wired |
| `topic_filter_selected` | A topic is clicked | `topic` | `app/topics/[topic]/page.tsx` | Not wired |
| `outbound_link_clicked` | GitHub / LinkedIn / Bluesky / employer link clicked | `destination` | `footer-elsewhere.tsx`, about page | Not wired |
| `feed_link_clicked` | RSS / JSON Feed / Sitemap link clicked | `feed_type` | `footer-elsewhere.tsx` | Not wired |
| `article_shared` | A share link (X / Bluesky / LinkedIn) clicked on an article | `platform`, `url` | `share-links.tsx` | Wired |
| `article_link_copied` | "Copy link" clicked on an article | `url` | `share-links.tsx` | Wired |

`archive_year_selected` (the homepage year filter) is deliberately left off — it's a plain `<Link>` navigation to `/?year=`, so GA4 already captures it as a pageview with no extra event needed.

## Conversions to mark in GA4

- **`newsletter_signup_succeeded`** — the one real goal for a content-first blog: growing the list.
- `code_block_copied` is worth watching as an engagement signal (which posts get used hands-on) but isn't a conversion.

## Privacy

Already reflected in [lib/privacy.ts](../lib/privacy.ts) / `/privacy`: GA4 via GTM, first-party cookies only, no PII in event properties, no advertising or remarketing tags. If that ever changes (e.g. an ads pixel gets added), the privacy policy needs a matching update — it currently describes exactly what's implemented here, no more.

## What's intentionally not done yet

The infrastructure above is live and safe to ship as-is (it's inert without a GTM ID). The `trackEvent()` calls into the components listed as "Not wired" haven't been added — wiring all of them is a larger, more opinionated diff (debounce timing for search, exact CTA locations for the newsletter modal, etc.) better done deliberately rather than all at once. Ask for specific ones and they can be wired in individually.
