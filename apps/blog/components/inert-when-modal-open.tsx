"use client";

import type { ReactNode } from "react";
import { useCommandPaletteOpen } from "./command-palette-context";
import { useSubscribeModalOpen } from "./subscribe-modal-context";

// Makes the rest of the page unreachable to pointer, keyboard, and
// assistive tech while any modal dialog (command palette, subscribe) is
// open — aria-modal alone doesn't hide background content from a screen
// reader's virtual cursor, `inert` does.
export function InertWhenModalOpen({ children }: { children: ReactNode }) {
  const paletteOpen = useCommandPaletteOpen();
  const subscribeOpen = useSubscribeModalOpen();
  return (
    <div inert={paletteOpen || subscribeOpen || undefined}>{children}</div>
  );
}
