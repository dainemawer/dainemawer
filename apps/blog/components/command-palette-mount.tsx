"use client";

import dynamic from "next/dynamic";
import type { Post } from "@/lib/posts";

// Code-split the palette out of the main bundle shared by every route —
// most visitors never open it. `ssr: false` requires a Client Component
// boundary, hence this wrapper around the otherwise-Server-Component root
// layout. The post dataset itself comes from the server (see app/layout.tsx)
// since the content-layer loader reads from the filesystem and can't run
// in the browser.
const CommandPalette = dynamic(
  () => import("./command-palette").then((mod) => mod.CommandPalette),
  { ssr: false },
);

export function CommandPaletteMount({ posts }: { posts: Post[] }) {
  return <CommandPalette posts={posts} />;
}
