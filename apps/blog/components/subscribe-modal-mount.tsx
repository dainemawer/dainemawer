"use client";

import dynamic from "next/dynamic";

// Same rationale as CommandPaletteMount: code-split the modal out of the
// main bundle — most visitors never open it.
const SubscribeModal = dynamic(
  () => import("./subscribe-modal").then((mod) => mod.SubscribeModal),
  { ssr: false },
);

export function SubscribeModalMount() {
  return <SubscribeModal />;
}
