import { about } from "@/lib/about";
import { toPlainText } from "@/lib/inline-markdown";
import type { PostContent } from "@/lib/mdx";
import type { Post } from "@/lib/posts";
import { site } from "@/lib/site";
import { getTopicBySlug } from "@/lib/topics";

const personId = `${site.url}/#person`;
const organizationId = `${site.url}/#organization`;
const websiteId = `${site.url}/#website`;

export function personSchema() {
  return {
    "@type": "Person",
    "@id": personId,
    name: site.name,
    url: site.url,
    jobTitle: site.role,
    description: about.summary,
    worksFor: {
      "@type": "Organization",
      name: site.company.name,
      url: site.company.url,
    },
    address: { "@type": "PostalAddress", addressLocality: site.location },
    sameAs: Object.values(site.social),
  };
}

// A separate Organization node for `publisher` — Google's Article guidance
// expects an Organization there (with an identity distinct from `author`),
// not the same Person doing double duty as both writer and publisher.
export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": organizationId,
    name: site.name,
    url: site.url,
    founder: { "@id": personId },
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": websiteId,
    url: site.url,
    name: site.name,
    description: site.tagline,
    inLanguage: "en",
    publisher: { "@id": organizationId },
  };
}

// The about page's dedicated node, tying it to the site-wide Person node
// (also emitted in app/layout.tsx) as its mainEntity — the pattern Google's
// guidance uses for a personal profile page. Person is inlined here rather
// than left as a bare `{"@id": ...}` pointer, per the same reasoning as
// articleSchema below: a crawler reading this script in isolation should
// still resolve who the page is about.
export function profilePageSchema() {
  return {
    "@type": "ProfilePage",
    "@id": `${site.url}/about#profile`,
    url: `${site.url}/about`,
    name: `About ${site.name}`,
    isPartOf: { "@id": websiteId },
    mainEntity: {
      "@type": "Person",
      "@id": personId,
      name: site.name,
      url: site.url,
      jobTitle: site.role,
      description: about.summary,
      knowsAbout: about.writesAbout.map((topic) => topic.label),
      sameAs: Object.values(site.social),
    },
  };
}

export function breadcrumbListSchema(
  items: { label: string; href?: string }[],
) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${site.url}${item.href}` } : {}),
    })),
  };
}

export function articleSchema(post: Post, content: PostContent) {
  const url = `${site.url}/${post.slug}`;
  const keywords = post.topics
    .map((slug) => getTopicBySlug(slug)?.name ?? slug)
    .join(", ");
  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: post.title,
    description: post.dek,
    image: `${url}/opengraph-image`,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    inLanguage: "en",
    wordCount: post.wordCount,
    ...(keywords ? { keywords } : {}),
    // Inlined rather than a bare `{"@id": ...}` pointer: a crawler that
    // reads this <script> in isolation (rather than merging it with the
    // Person/Organization nodes declared elsewhere on the page) should
    // still see who wrote and published this, not just an unresolved ref.
    author: {
      "@type": "Person",
      "@id": personId,
      name: site.name,
      url: site.url,
    },
    publisher: {
      "@type": "Organization",
      "@id": organizationId,
      name: site.name,
      url: site.url,
    },
    isPartOf: { "@id": websiteId },
    ...(content.shortAnswer
      ? { abstract: toPlainText(content.shortAnswer) }
      : {}),
  };
}

export function faqPageSchema(faq: PostContent["faq"]) {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: toPlainText(item.question),
      acceptedAnswer: {
        "@type": "Answer",
        text: toPlainText(item.answer),
      },
    })),
  };
}
