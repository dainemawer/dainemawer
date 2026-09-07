import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { MetaRow } from "@/components/meta-row";
import { PageShell } from "@/components/page-shell";
import { TrackedLink } from "@/components/tracked-link";
import { about } from "@/lib/about";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Work history, speaking, and how to verify who's actually writing this.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PageShell
      sidebar={
        <nav aria-label="Sections" className="flex flex-col gap-3.5 md:pr-10">
          <div className="mb-1 text-faint text-xs">Elsewhere on this page</div>
          <ul className="flex flex-row flex-wrap gap-x-4 gap-y-2 md:flex-col md:gap-3.5">
            <li>
              <Link
                href="/about"
                aria-current="page"
                className="text-ink text-sm"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/uses"
                className="text-muted text-sm transition-colors duration-140 ease-out hover:text-ink focus-visible:text-ink"
              >
                Uses
              </Link>
            </li>
            <li>
              <Link
                href="/now"
                className="text-muted text-sm transition-colors duration-140 ease-out hover:text-ink focus-visible:text-ink"
              >
                Now
              </Link>
            </li>
          </ul>
        </nav>
      }
    >
      <div className="mx-auto max-w-content">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "About" }]}
        />

        <h1 className="mt-4.5 text-2xl text-ink tracking-tight">{site.name}</h1>
        <div className="mt-2 text-md text-muted text-pretty">
          {site.role} at{" "}
          <TrackedLink
            href={site.company.url}
            event="outbound_link_clicked"
            target="_blank"
            rel="noreferrer"
            className="text-ink hover:opacity-60 focus-visible:opacity-60"
          >
            {site.company.name}
            <span className="sr-only"> (opens in a new tab)</span>
          </TrackedLink>
          . {site.location}.
        </div>

        <div className="mt-13">
          <MetaRow label="In short">
            <p className="text-md text-ink leading-relaxed text-pretty">
              {about.summary}
            </p>
          </MetaRow>
        </div>

        <div className="mt-17 flex flex-col gap-10">
          <MetaRow label="Work">
            <ul className="flex flex-col gap-5.5 text-base text-ink leading-normal">
              {about.work.map((item) => (
                <li
                  key={item.period}
                  className="grid grid-cols-1 gap-x-8 gap-y-0.5 sm:grid-cols-subrow sm:items-baseline sm:gap-y-0"
                >
                  <div className="text-sm text-muted">{item.period}</div>
                  <div>{item.description}</div>
                </li>
              ))}
            </ul>
          </MetaRow>

          <MetaRow id="clients" label="Clients">
            <ul className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
              {about.clients.map((client, index) => (
                <li key={client} className="flex items-baseline gap-x-2">
                  {index > 0 && <span className="text-divider">|</span>}
                  <span>{client}</span>
                </li>
              ))}
            </ul>
          </MetaRow>

          <MetaRow id="speaking" label="Speaking">
            <ul className="flex flex-col gap-3.5 text-base text-ink leading-normal">
              {about.speaking.map((item) => (
                <li
                  key={item.venue}
                  className="grid grid-cols-1 gap-x-8 gap-y-0.5 sm:grid-cols-subrow sm:items-baseline sm:gap-y-0"
                >
                  <div className="text-sm text-muted">{item.venue}</div>
                  <div>{item.topic}</div>
                </li>
              ))}
            </ul>
          </MetaRow>

          <MetaRow id="writing" label="Writes about">
            <ul className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
              {about.writesAbout.map((topic, index) => (
                <li key={topic.href} className="flex items-baseline gap-x-2">
                  {index > 0 && <span className="text-divider">|</span>}
                  <Link
                    href={topic.href}
                    className="hover:text-ink focus-visible:text-ink"
                  >
                    {topic.label}
                  </Link>
                </li>
              ))}
            </ul>
          </MetaRow>

          <MetaRow label="Verify">
            <ul className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
              {about.verify.map((link, index) => (
                <li key={link.href} className="flex items-baseline gap-x-2">
                  {index > 0 && <span className="text-divider">|</span>}
                  {link.href.startsWith("mailto:") ? (
                    <a
                      href={link.href}
                      className="hover:text-ink focus-visible:text-ink"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <TrackedLink
                      href={link.href}
                      event="outbound_link_clicked"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-ink focus-visible:text-ink"
                    >
                      {link.label}
                    </TrackedLink>
                  )}
                </li>
              ))}
            </ul>
          </MetaRow>
        </div>
      </div>
    </PageShell>
  );
}
