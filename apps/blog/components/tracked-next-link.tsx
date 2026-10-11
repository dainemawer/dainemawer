"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * A client-side <Link> that fires a dataLayer event on click — the in-site
 * counterpart to TrackedLink, which renders a plain <a> and so would turn
 * a route change into a full document load (and lose view transitions).
 */
export function TrackedNextLink({
  event,
  eventParams,
  onClick,
  ...rest
}: ComponentProps<typeof Link> & {
  event: string;
  eventParams?: Record<string, unknown>;
}) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        trackEvent(event, eventParams);
        onClick?.(e);
      }}
    />
  );
}
