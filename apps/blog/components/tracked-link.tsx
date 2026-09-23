"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * A plain external/outbound <a> that fires a dataLayer event on click,
 * for links that live inside otherwise-Server-Component pages (footer,
 * about page) where wiring an onClick handler directly isn't an option.
 */
export function TrackedLink({
  href,
  event,
  eventParams,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  event: string;
  eventParams?: Record<string, unknown>;
}) {
  return (
    <a
      href={href}
      onClick={() => trackEvent(event, { destination: href, ...eventParams })}
      {...rest}
    >
      {children}
    </a>
  );
}
