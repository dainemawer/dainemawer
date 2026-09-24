import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageShell } from "@/components/page-shell";
import { Toc } from "@/components/toc";
import { agents } from "@/lib/agents";
import { site } from "@/lib/site";

const sections = [
  { id: "when-to-use", label: "When to use" },
  { id: "when-not-to-use", label: "When not to" },
  { id: "fetching", label: "Fetching" },
  { id: "endpoints", label: "Endpoints" },
  { id: "attribution", label: "Attribution" },
];

export const metadata: Metadata = {
  title: "Agent and developer resources",
  description:
    "When an AI agent should use dainemawer.com, how to fetch any page as Markdown, and every machine-readable endpoint on the site.",
  alternates: {
    canonical: "/agents",
    types: { "text/markdown": "/agents.md" },
  },
};

export default function AgentsPage() {
  return (
    <PageShell
      sidebar={
        <Toc
          heading="On this page"
          ariaLabel="On this page"
          items={sections}
          sticky
        />
      }
    >
      <div className="mx-auto max-w-content">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Agents" }]}
        />

        <h1 className="mt-4.5 text-2xl text-ink tracking-tight text-pretty">
          Agent and developer resources
        </h1>
        <div className="mt-2 text-md text-muted text-pretty">
          {agents.summary}
        </div>
        <div className="mt-5 flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
          <span>{site.url.replace("https://", "")}</span>
          <span className="text-divider">|</span>
          <span>Accept: text/markdown</span>
          <span className="text-divider">|</span>
          <a
            href="/agents.md"
            className="text-ink transition-opacity duration-140 ease-out hover:opacity-60 focus-visible:opacity-60"
          >
            This page as Markdown
          </a>
        </div>

        <div className="mt-15 flex flex-col gap-11">
          <section className="grid grid-cols-1 gap-x-12 gap-y-2 sm:grid-cols-meta sm:items-start sm:gap-y-0">
            <h2
              id="when-to-use"
              className="scroll-mt-10 font-normal text-faint text-sm sm:text-right"
            >
              When to use
            </h2>
            <ul className="flex flex-col gap-5 text-base text-ink leading-normal">
              {agents.whenToUse.map((entry) => (
                <li
                  key={entry.label}
                  className="grid grid-cols-1 gap-x-8 gap-y-0.5 sm:grid-cols-subrow sm:items-baseline sm:gap-y-0"
                >
                  <div className="font-medium">{entry.label}</div>
                  <div className="text-muted">{entry.body}</div>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid grid-cols-1 gap-x-12 gap-y-2 sm:grid-cols-meta sm:items-start sm:gap-y-0">
            <h2
              id="when-not-to-use"
              className="scroll-mt-10 font-normal text-faint text-sm sm:text-right"
            >
              When not to
            </h2>
            <ul className="flex flex-col gap-3 text-base text-muted leading-normal text-pretty">
              {agents.whenNotToUse.map((entry) => (
                <li key={entry.slice(0, 40)}>{entry}</li>
              ))}
            </ul>
          </section>

          <section className="grid grid-cols-1 gap-x-12 gap-y-2 sm:grid-cols-meta sm:items-start sm:gap-y-0">
            <h2
              id="fetching"
              className="scroll-mt-10 font-normal text-faint text-sm sm:text-right"
            >
              Fetching
            </h2>
            <ul className="flex flex-col gap-5 text-base text-ink leading-normal">
              {agents.howToFetch.map((entry) => (
                <li
                  key={entry.label}
                  className="grid grid-cols-1 gap-x-8 gap-y-0.5 sm:grid-cols-subrow sm:items-baseline sm:gap-y-0"
                >
                  <div className="font-medium">{entry.label}</div>
                  <div className="text-muted">{entry.body}</div>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid grid-cols-1 gap-x-12 gap-y-2 sm:grid-cols-meta sm:items-start sm:gap-y-0">
            <h2
              id="endpoints"
              className="scroll-mt-10 font-normal text-faint text-sm sm:text-right"
            >
              Endpoints
            </h2>
            <ul className="flex flex-col gap-5 text-base text-ink leading-normal">
              {agents.resources.map((resource) => (
                <li
                  key={resource.href}
                  className="grid grid-cols-1 gap-x-8 gap-y-0.5 sm:grid-cols-subrow sm:items-baseline sm:gap-y-0"
                >
                  <a
                    href={resource.href}
                    className="font-medium transition-opacity duration-140 ease-out hover:opacity-60 focus-visible:opacity-60"
                  >
                    {resource.label}
                  </a>
                  <div className="text-muted">{resource.description}</div>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid grid-cols-1 gap-x-12 gap-y-2 sm:grid-cols-meta sm:items-start sm:gap-y-0">
            <h2
              id="attribution"
              className="scroll-mt-10 font-normal text-faint text-sm sm:text-right"
            >
              Attribution
            </h2>
            <div className="flex flex-col gap-3 text-base text-muted leading-normal text-pretty">
              <p>{agents.citation}</p>
              <p>
                Questions:{" "}
                <a
                  href={`mailto:${agents.contact}`}
                  className="text-ink transition-opacity duration-140 ease-out hover:opacity-60 focus-visible:opacity-60"
                >
                  {agents.contact}
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
