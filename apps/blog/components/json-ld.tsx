/**
 * Renders one or more schema.org objects as a single JSON-LD <script>.
 * An array is wrapped in `@graph` so related entities (e.g. Person +
 * WebSite) can share one script tag and reference each other by `@id`.
 */
export function JsonLd({ schema }: { schema: object | object[] }) {
  const data = Array.isArray(schema)
    ? { "@context": "https://schema.org", "@graph": schema }
    : { "@context": "https://schema.org", ...schema };

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires a raw <script> tag; payload is server-built from trusted frontmatter/config, not user input, and `<` is escaped below
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
