import { footerNav, site } from "@/lib/site";
import { MetaRow } from "./meta-row";
import { TrackedLink } from "./tracked-link";

// Slugified feed_type for feed_link_clicked, keyed by the footer link label.
const FEED_TYPES: Record<string, string> = {
  RSS: "rss",
  "JSON Feed": "json",
  Sitemap: "sitemap",
};

export function FooterElsewhere() {
  return (
    <footer className="mt-22 border-divider border-t pt-6.5">
      <MetaRow
        label={<span className="sr-only sm:not-sr-only">Elsewhere</span>}
      >
        <div className="flex flex-col gap-5.5">
          <nav
            aria-label="Elsewhere"
            className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm text-muted sm:grid-cols-4 sm:gap-x-8 sm:gap-y-0"
          >
            {footerNav.map((group) => (
              <div key={group.heading} className="flex flex-col gap-2.5">
                <h3 className="font-normal text-faint text-xs">
                  {group.heading}
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {group.links.map((link) => {
                    if (group.heading === "Elsewhere") {
                      return (
                        <li key={link.label}>
                          <TrackedLink
                            href={link.href}
                            event="outbound_link_clicked"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-ink focus-visible:text-ink"
                          >
                            {link.label}
                          </TrackedLink>
                        </li>
                      );
                    }
                    if (group.heading === "Feeds") {
                      return (
                        <li key={link.label}>
                          <TrackedLink
                            href={link.href}
                            event="feed_link_clicked"
                            eventParams={{ feed_type: FEED_TYPES[link.label] }}
                            className="hover:text-ink focus-visible:text-ink"
                          >
                            {link.label}
                          </TrackedLink>
                        </li>
                      );
                    }
                    return (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="hover:text-ink focus-visible:text-ink"
                        >
                          {link.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="text-xs text-faint">
            {site.name} — {site.tagline}. © {new Date().getFullYear()}
          </div>
        </div>
      </MetaRow>
    </footer>
  );
}
