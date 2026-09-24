import { site } from "./site";

export type ContactReason = {
  /** Submitted with the message and used as the email subject prefix. */
  value: string;
  label: string;
  /** Placeholder for the message field, so the prompt matches the intent. */
  hint: string;
  /** Whether to ask which post this is about. */
  needsPost: boolean;
};

// Single source of truth for /contact, /contact.md and the ContactPage
// JSON-LD, same pattern as lib/about.ts and lib/privacy.ts — the page, its
// markdown twin and its structured data can't drift apart.
export const contact = {
  dek: "A question about a post, a talk invitation, or something I got wrong — the inbox is open.",

  // The three facts worth knowing before writing, on one line under the dek.
  meta: ["Cape Town, GMT+2", "Replies within two working days"],

  summary: `The fastest way to reach me is email: ${site.email}. A question about a post, a talk invitation, or a correction all land in the same inbox, and replies usually take about two working days.`,

  reasons: [
    {
      value: "speaking",
      label: "Speaking",
      hint: "Event, date, audience, and what you'd like me to talk about.",
      needsPost: false,
    },
    {
      value: "post",
      label: "A post",
      hint: "What's on your mind about it?",
      needsPost: true,
    },
    {
      value: "correction",
      label: "A correction",
      hint: "What's wrong, and what should it say? A source helps.",
      needsPost: true,
    },
    {
      value: "other",
      label: "Something else",
      hint: "Go ahead.",
      needsPost: false,
    },
  ] satisfies ContactReason[],

  // Said plainly rather than left for someone to discover after writing a
  // long message that was never going to get a yes.
  notTaking: "New consulting or freelance work, for now.",

  // The design links this to a client portal that doesn't exist yet, so it
  // points at a pre-addressed email in the meantime rather than shipping a
  // dead link. When the portal lands, this becomes its URL and nothing else
  // on the page has to change.
  clientAccess: {
    lead: "Already a client?",
    label: "Get project access →",
    href: `mailto:${site.email}?subject=Project%20access`,
  },

  // The verifiable alternatives — an agent or a person checking whether this
  // is a real identity shouldn't have to take a contact form's word for it.
  elsewhere: [
    { label: "Email", href: `mailto:${site.email}` },
    { label: "Bluesky", href: site.social.bluesky },
    { label: "LinkedIn", href: site.social.linkedin },
    { label: "GitHub", href: site.social.github },
  ],
} as const;

export const DEFAULT_REASON = contact.reasons[0].value;

export function reasonByValue(value: string): ContactReason | undefined {
  return contact.reasons.find((reason) => reason.value === value);
}
