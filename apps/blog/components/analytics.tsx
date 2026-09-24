import Script from "next/script";

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * No-ops entirely until NEXT_PUBLIC_GTM_ID is set. The dataLayer bootstrap
 * is a same-origin static file rather than an inline script so this needs
 * no CSP nonce or hash — see the comment above cspHeader in next.config.ts.
 */
export function Analytics() {
  if (!gtmId) return null;

  return (
    <>
      <Script src="/gtm-init.js" strategy="beforeInteractive" />
      <Script
        src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`}
        strategy="afterInteractive"
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
