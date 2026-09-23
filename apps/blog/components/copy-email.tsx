"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { site } from "@/lib/site";

// The design's "Copy" affordance next to the address, as a real button so it
// can be reached by keyboard. The label swap is announced politely rather
// than silently, since for a screen reader the only evidence the copy worked
// is the word changing.
export function CopyEmail() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(site.email);
    } catch {
      // Clipboard access can be denied, and there's nothing useful to say
      // about it: the address is right there as a selectable mailto link.
      return;
    }
    setCopied(true);
    trackEvent("contact_email_copied");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="cursor-pointer text-faint text-xs hover:text-ink focus-visible:text-ink"
    >
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      <span className="sr-only"> email address</span>
    </button>
  );
}
