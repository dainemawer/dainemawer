import type { ReactNode } from "react";
import { ViewTransition } from "react";

/**
 * Wraps a page's main content so it slides in/out based on the
 * `transitionTypes` tagged on the <Link> that triggered navigation.
 * "sequence-*" (prev/next article) reuses the same slide classes as
 * "nav-*" (list <-> article/topic hierarchy).
 *
 * `vtKey` forces a remount when set (e.g. the article slug) — same-route
 * dynamic segment swaps otherwise reuse the subtree and enter/exit never
 * fire. See references/nextjs.md#same-route-dynamic-segment-transitions.
 */
export function DirectionalTransition({
  children,
  vtKey,
}: {
  children: ReactNode;
  vtKey?: string;
}) {
  return (
    <ViewTransition
      key={vtKey}
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        "sequence-next": "nav-forward",
        "sequence-prev": "nav-back",
        default: "none",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        "sequence-next": "nav-forward",
        "sequence-prev": "nav-back",
        default: "none",
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
