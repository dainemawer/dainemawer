"use client";

import { trackEvent } from "@/lib/analytics";
import { useSetCommandPaletteOpen } from "./command-palette-context";

export function SearchTrigger() {
  const setOpen = useSetCommandPaletteOpen();

  return (
    <button
      type="button"
      onClick={() => {
        trackEvent("command_palette_opened", { source: "click" });
        setOpen(true);
      }}
      className="flex cursor-pointer items-baseline gap-1.5 text-muted hover:text-ink focus-visible:text-ink"
    >
      <span>Search</span>
      <span className="font-mono text-2xs text-faint" aria-hidden="true">
        ⌘K
      </span>
    </button>
  );
}
