export const privacyUpdated = "2026-09-05";

export const privacySections: { id: string; label: string; body: string }[] = [
  {
    id: "overview",
    label: "Overview",
    body: "This site is run by Daine Mawer, published independently of any employer. It collects the minimum data needed to understand readership and let visitors subscribe to new posts — no accounts, no comments, no data sold to anyone.",
  },
  {
    id: "analytics",
    label: "Analytics",
    body: "Page views and general usage are measured with Google Analytics, loaded through Google Tag Manager. This records things like which pages are read, how visitors arrived (referrer/UTM parameters), and coarse device and location data derived from IP address — never the IP address itself, which Google Analytics does not store. No data is used to identify an individual visitor.",
  },
  {
    id: "cookies",
    label: "Cookies",
    body: "Google Analytics sets first-party cookies to distinguish repeat visits from new ones. No advertising or cross-site tracking cookies are set. Blocking cookies in your browser or an extension like uBlock Origin will stop analytics from running without affecting how the site works.",
  },
  {
    id: "newsletter",
    label: "Newsletter",
    body: "If you subscribe, your email address is stored only to deliver new-post notifications and is passed to the third-party email service used to send them. It is never shared for any other purpose. Every email includes an unsubscribe link, which removes your address immediately.",
  },
  {
    id: "hosting",
    label: "Hosting",
    body: "The site is hosted on Vercel, which processes standard server request logs (IP address, user agent) as part of serving pages. See Vercel's own privacy policy for how it handles that data.",
  },
  {
    id: "rights",
    label: "Your rights",
    body: "Wherever you're reading from — GDPR in the EU/UK, POPIA in South Africa, or elsewhere — you can ask what data is held about you, request its deletion, or unsubscribe at any time by emailing the address below.",
  },
  {
    id: "changes",
    label: "Changes",
    body: "This policy may be updated as the site's tooling changes. The date above always reflects the last revision.",
  },
];
