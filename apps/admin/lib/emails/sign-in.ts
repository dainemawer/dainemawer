// The magic-link email, styled like the login page: white surface, the
// wordmark, ink text, one ink button. Email clients ignore stylesheets and
// SVG, so it's tables and inline styles, and the logo is a PNG served from
// the app's public folder (proxy.ts lets /email/* through without a session).

const INK = "#111111";
const MUTED = "#6b6b6b";
const BORDER = "#e4e4e4";
const FONT =
  "Figtree, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export function signInEmail({
  url,
  minutes,
}: {
  url: string;
  /** How long the link lasts. */
  minutes: number;
}) {
  // Served by the same deployment that made the link.
  const origin = new URL(url).origin;
  const host = new URL(url).host;
  const href = escapeHtml(url);

  const text = `Sign in to ${host}:\n\n${url}\n\nThis link works once and expires in ${minutes} minutes. If you didn't ask for it, ignore this email.`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Sign in to Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#ffffff;color:${INK};font-family:${FONT};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;">Your sign-in link for ${host}. It works once and expires in ${minutes} minutes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
<tr><td align="center" style="padding:48px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:384px;">
<tr><td style="padding-bottom:40px;">
<img src="${origin}/email/logo.png" width="149" height="20" alt="dainemawer." style="display:block;border:0;width:149px;height:20px;">
</td></tr>
<tr><td style="font-family:${FONT};font-size:30px;line-height:1.2;font-weight:700;color:${INK};">Admin</td></tr>
<tr><td style="padding:8px 0 32px;font-family:${FONT};font-size:14.5px;line-height:1.4;color:${MUTED};">Here's your link to sign in. It works once and expires in ${minutes} minutes.</td></tr>
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" bgcolor="${INK}" style="border-radius:6px;">
<a href="${href}" style="display:block;padding:10px 16px;font-family:${FONT};font-size:14.5px;line-height:16px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:6px;">Sign in</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding-top:24px;font-family:${FONT};font-size:13.5px;line-height:1.4;color:${MUTED};">Or paste this into your browser:<br><a href="${href}" style="color:${INK};word-break:break-all;">${href}</a></td></tr>
<tr><td style="padding-top:32px;"><div style="border-top:1px solid ${BORDER};font-size:0;line-height:0;">&nbsp;</div></td></tr>
<tr><td style="padding-top:16px;font-family:${FONT};font-size:12px;line-height:1.4;color:${MUTED};">If you didn't ask to sign in, ignore this email. Nobody can get in without the link.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject: `Your ${host} sign-in link`, text, html };
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
