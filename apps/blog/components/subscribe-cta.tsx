"use client";

import { trackEvent } from "@/lib/analytics";
import { useSetSubscribeModalOpen } from "./subscribe-modal-context";

// The end of an article is when a reader has just decided it was worth their
// time, so this is the one place the site asks. It opens the same modal as
// the header link rather than embedding a second form.
export function SubscribeCta({ postSlug }: { postSlug: string }) {
  const setSubscribeOpen = useSetSubscribeModalOpen();

  return (
    <section
      aria-labelledby="subscribe-cta-heading"
      className="flex flex-col items-start gap-4 rounded-lg bg-ink/[0.04] px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8"
    >
      <div className="flex flex-col gap-1.5">
        <h2
          id="subscribe-cta-heading"
          className="text-lg text-ink tracking-tight"
        >
          New posts by email
        </h2>
        <p className="text-base text-muted leading-normal text-pretty">
          Sent when they're published. No spam, unsubscribe anytime.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          trackEvent("newsletter_modal_opened", {
            location: "article_end",
            post_slug: postSlug,
          });
          setSubscribeOpen(true);
        }}
        className="shrink-0 cursor-pointer rounded-md bg-ink px-5 py-2.5 text-sm text-surface transition-opacity duration-140 ease-out hover:opacity-80 focus-visible:opacity-80"
      >
        Subscribe
      </button>
    </section>
  );
}
