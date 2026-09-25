// Colors reused verbatim from apps/blog/app/globals.css — see the "Design
// review" section of the technical spec's Design brief tab for why: light
// theme only, no toggle, and nothing lighter than #767676 for text a client
// needs to read (the blog's own documented WCAG AA floor).
export const colors = {
  ink: "#111111",
  muted: "#6b6b6b", // ~5.3:1 on white
  faint: "#767676", // ~4.5:1 on white — AA floor, nothing lighter for real copy
  divider: "#cfcfcf", // dividers only, never text
  surface: "#ffffff",
  error: "#b3261e",
} as const;
