import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { ContactForm } from "@/components/contact-form";
import { CopyEmail } from "@/components/copy-email";
import { JsonLd } from "@/components/json-ld";
import { MetaRow } from "@/components/meta-row";
import { PageShell } from "@/components/page-shell";
import { contact } from "@/lib/contact";
import { contactPageSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: contact.dek,
  alternates: {
    canonical: "/contact",
    types: { "text/markdown": "/contact.md" },
  },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd schema={contactPageSchema()} />
      <PageShell sidebar={null}>
        <div className="mx-auto max-w-content">
          <Breadcrumb
            items={[{ label: "Home", href: "/" }, { label: "Contact" }]}
          />

          <h1 className="mt-4.5 text-2xl text-ink tracking-tight">Contact</h1>
          <div className="mt-2 text-md text-muted text-pretty">
            {contact.dek}
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
            {/* The separator trails its item rather than leading the next
                one, so a wrap at narrow widths leaves it at the end of the
                first line instead of stranded at the start of the second. */}
            {contact.meta.map((item, index) => (
              <span key={item} className="flex items-baseline gap-x-2">
                {item}
                {index < contact.meta.length - 1 && (
                  <span className="text-divider">|</span>
                )}
              </span>
            ))}
          </div>

          <div className="mt-15 flex flex-col gap-11">
            <MetaRow label="The short way">
              <div className="flex flex-wrap items-baseline gap-x-4.5 gap-y-1">
                <a
                  href={`mailto:${site.email}`}
                  className="text-ink text-xl tracking-tight hover:opacity-60 focus-visible:opacity-60"
                >
                  {site.email}
                </a>
                <CopyEmail />
              </div>
            </MetaRow>

            <ContactForm />

            <MetaRow label="Not taking">
              <p className="max-w-160 text-base text-muted leading-normal text-pretty">
                {contact.notTaking} {contact.clientAccess.lead}{" "}
                <a
                  href={contact.clientAccess.href}
                  className="text-ink underline decoration-divider underline-offset-2 hover:decoration-ink focus-visible:decoration-ink"
                >
                  {contact.clientAccess.label}
                </a>
              </p>
            </MetaRow>
          </div>
        </div>
      </PageShell>
    </>
  );
}
