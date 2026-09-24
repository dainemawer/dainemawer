"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

// Brand mark paths, verified against Simple Icons (viewBox 0 0 24 24,
// fill="currentColor") rather than hand-drawn — a wrong path silently
// renders as a garbled logo.
const ICON_PATHS = {
  x: "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z",
  bluesky:
    "M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
} as const;

function BrandIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

// Generic (non-brand) icons, verified against Lucide.
function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function shareTargets(title: string, url: string) {
  return [
    {
      key: "x",
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      icon: ICON_PATHS.x,
    },
    {
      key: "bluesky",
      label: "Bluesky",
      // No separate url param on Bluesky's compose intent — the link has
      // to be part of the text itself.
      href: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${title} ${url}`)}`,
      icon: ICON_PATHS.bluesky,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: ICON_PATHS.linkedin,
    },
  ];
}

/**
 * Same "faint label above" treatment as Toc so the two read as one sidebar
 * unit — rendered directly beneath it, inside the same sticky wrapper, on
 * the article page. Icon-only: each control carries its accessible name via
 * aria-label/sr-only text rather than visible copy.
 */
export function ShareLinks({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackEvent("article_link_copied", { url });
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be denied by the browser or permissions
      // policy; leave the button as-is rather than claiming success.
    }
  }

  return (
    <nav
      aria-label="Share this article"
      className="hidden flex-col gap-3.5 md:flex md:pr-10"
    >
      <div className="mb-1 text-faint text-xs">Share</div>
      <ul className="flex items-center gap-4">
        {shareTargets(title, url).map((target) => (
          <li key={target.key}>
            <a
              href={target.href}
              target="_blank"
              rel="noreferrer"
              title={`Share on ${target.label}`}
              aria-label={`Share on ${target.label} (opens in a new tab)`}
              onClick={() =>
                trackEvent("article_shared", { platform: target.key, url })
              }
              className="block text-muted transition-colors duration-140 ease-out hover:text-ink focus-visible:text-ink"
            >
              <BrandIcon path={target.icon} />
            </a>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={copyLink}
            title="Copy link"
            aria-live="polite"
            className="block cursor-pointer text-muted transition-colors duration-140 ease-out hover:text-ink focus-visible:text-ink"
          >
            {copied ? <CheckIcon /> : <LinkIcon />}
            <span className="sr-only">{copied ? "Copied" : "Copy link"}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
