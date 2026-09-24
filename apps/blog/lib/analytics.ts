declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Pushes a GTM/GA4 event to the dataLayer. No-ops on the server and when
 * no GTM container is loaded (see components/analytics.tsx), so call sites
 * don't need to guard on whether analytics is configured.
 */
export function trackEvent(
  event: string,
  params: Record<string, unknown> = {},
) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  window.dataLayer.push({ event, ...params });
}
