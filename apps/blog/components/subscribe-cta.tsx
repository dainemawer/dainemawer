"use client";

import { trackEvent } from "@/lib/analytics";
import { MetaRow } from "./meta-row";
import { useSetSubscribeModalOpen } from "./subscribe-modal-context";

// The end of an article is when a reader has just decided it was worth their
// time, so this is the one place the site asks. It opens the same modal as
// the header link rather than embedding a second form.
export function SubscribeCta({ postSlug }: { postSlug: string }) {
  const setSubscribeOpen = useSetSubscribeModalOpen();

  return (
    <MetaRow label="Subscribe">
      <div className="flex flex-col items-start gap-3">
        <p className="text-base text-ink leading-normal text-pretty">
          New posts by email, when they're published. No spam, unsubscribe
          anytime.
        </p>
        <button
          type="button"
          onClick={() => {
            trackEvent("newsletter_modal_opened", {
              location: "article_end",
              post_slug: postSlug,
            });
            setSubscribeOpen(true);
          }}
          className="cursor-pointer rounded-md border border-divider px-3 py-1.5 text-ink text-sm transition-colors duration-140 ease-out hover:bg-ink/5 focus-visible:bg-ink/5"
        >
          Subscribe
        </button>
      </div>
    </MetaRow>
  );
}
