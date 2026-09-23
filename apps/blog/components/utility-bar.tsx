"use client";

import { trackEvent } from "@/lib/analytics";
import { SearchTrigger } from "./search-trigger";
import { useSetSubscribeModalOpen } from "./subscribe-modal-context";

export function UtilityBar() {
  const setSubscribeOpen = useSetSubscribeModalOpen();

  return (
    <div className="flex h-6 items-baseline justify-end gap-2 text-sm text-muted">
      <SearchTrigger />
      <span className="text-divider">|</span>
      <button
        type="button"
        onClick={() => {
          trackEvent("newsletter_modal_opened", { location: "nav" });
          setSubscribeOpen(true);
        }}
        className="cursor-pointer hover:text-ink focus-visible:text-ink"
      >
        Subscribe
      </button>
      <span className="text-divider">|</span>
      <a
        href="/rss.xml"
        onClick={() => trackEvent("feed_link_clicked", { feed_type: "rss" })}
        className="hover:text-ink focus-visible:text-ink"
      >
        RSS
      </a>
    </div>
  );
}
