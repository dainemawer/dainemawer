"use client";

import { createContext, type ReactNode, use, useEffect, useState } from "react";

const SubscribeModalStateContext = createContext<boolean | null>(null);
const SubscribeModalDispatchContext = createContext<
  ((open: boolean) => void) | null
>(null);

export function SubscribeModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <SubscribeModalDispatchContext value={setOpen}>
      <SubscribeModalStateContext value={open}>
        {children}
      </SubscribeModalStateContext>
    </SubscribeModalDispatchContext>
  );
}

export function useSubscribeModalOpen() {
  const context = use(SubscribeModalStateContext);
  if (context === null) {
    throw new Error(
      "useSubscribeModalOpen must be used within a SubscribeModalProvider",
    );
  }
  return context;
}

export function useSetSubscribeModalOpen() {
  const context = use(SubscribeModalDispatchContext);
  if (context === null) {
    throw new Error(
      "useSetSubscribeModalOpen must be used within a SubscribeModalProvider",
    );
  }
  return context;
}
