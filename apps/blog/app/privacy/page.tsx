import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { MetaRow } from "@/components/meta-row";
import { PageShell } from "@/components/page-shell";
import { privacySections, privacyUpdated } from "@/lib/privacy";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What data this site collects, and why.",
  alternates: {
    canonical: "/privacy",
    types: { "text/markdown": "/privacy.md" },
  },
};

export default function PrivacyPage() {
  return (
    <PageShell sidebar={null}>
      <div className="mx-auto max-w-content">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Privacy" }]}
        />

        <h1 className="mt-4.5 text-2xl text-ink tracking-tight">
          Privacy Policy
        </h1>
        <div className="mt-2 text-md text-muted text-pretty">
          What data this site collects, and why.
        </div>
        <div className="mt-5 text-sm text-muted">
          Last updated {privacyUpdated}
        </div>

        <div className="mt-15 flex flex-col gap-10">
          {privacySections.map((section) => (
            <MetaRow key={section.id} id={section.id} label={section.label}>
              <p className="text-md text-ink leading-relaxed text-pretty">
                {section.body}
              </p>
            </MetaRow>
          ))}

          <MetaRow label="Contact">
            <p className="text-md text-ink leading-relaxed text-pretty">
              Questions about this policy, or a request to see or delete your
              data: email{" "}
              <a
                href={`mailto:${site.email}`}
                className="text-ink transition-opacity duration-140 ease-out hover:opacity-60 focus-visible:opacity-60"
              >
                {site.email}
              </a>
              .
            </p>
          </MetaRow>
        </div>
      </div>
    </PageShell>
  );
}
