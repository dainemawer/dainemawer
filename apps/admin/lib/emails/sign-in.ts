import {
  button,
  emailLayout,
  escapeHtml,
  FONT,
  INK,
  MUTED,
  paragraph,
} from "@/lib/emails/layout";

/** The magic-link email. */
export function signInEmail({
  url,
  minutes,
}: {
  url: string;
  /** How long the link lasts. */
  minutes: number;
}) {
  // Served by the same deployment that made the link.
  const { origin, host } = new URL(url);
  const text = `Sign in to ${host}:\n\n${url}\n\nThis link works once and expires in ${minutes} minutes. If you didn't ask for it, ignore this email.`;
  const html = emailLayout({
    origin,
    title: "Sign in to Admin",
    preheader: `Your sign-in link for ${host}. It works once and expires in ${minutes} minutes.`,
    heading: "Admin",
    body:
      paragraph(
        `Here's your link to sign in. It works once and expires in ${minutes} minutes.`,
      ) +
      button(url, "Sign in") +
      `<tr><td style="padding:24px 0 16px;font-family:${FONT};font-size:13.5px;line-height:1.4;color:${MUTED};">Or paste this into your browser:<br><a href="${escapeHtml(url)}" style="color:${INK};word-break:break-all;">${escapeHtml(url)}</a></td></tr>`,
    footer:
      "If you didn't ask to sign in, ignore this email. Nobody can get in without the link.",
  });
  return { subject: `Your ${host} sign-in link`, text, html };
}

/** Sent instead of a link when passkeys are on and email sign-in is off. */
export function emailSignInOffEmail({ origin }: { origin: string }) {
  const { host } = new URL(origin);
  const text = `Someone asked for a sign-in link for ${host}, but email sign-in is off because you use a passkey. Sign in with your passkey instead.\n\nIf this wasn't you, nothing happened: no link was sent. To turn email links back on (if you've lost your passkey), set ALLOW_EMAIL_SIGN_IN=1 in Vercel and redeploy.`;
  const html = emailLayout({
    origin,
    title: "Email sign-in is off",
    preheader: "No link was sent: sign in with your passkey.",
    heading: "Use your passkey",
    body:
      paragraph(
        `Someone asked for a sign-in link for ${escapeHtml(host)}, but email sign-in is off because you use a passkey. Sign in with your passkey instead.`,
      ) + button(`${origin}/login`, "Go to sign in"),
    footer:
      "If this wasn't you, nothing happened: no link was sent. Lost your passkey? Set ALLOW_EMAIL_SIGN_IN=1 in Vercel and redeploy to turn email links back on.",
  });
  return { subject: `Sign in to ${host} with your passkey`, text, html };
}
