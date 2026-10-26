// The shell every HTML email shares, styled like the login page: white
// surface, the wordmark, ink text. Email clients ignore stylesheets and SVG,
// so it's tables and inline styles, and the logo is a PNG served from the
// app's public folder (proxy.ts lets /email/* through without a session).

export const INK = "#111111";
export const MUTED = "#6b6b6b";
export const BORDER = "#e4e4e4";
export const FONT =
  "Figtree, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/** Paragraph and button rows for `body`. Pass text through escapeHtml first. */
export const paragraph = (html: string, muted = true) =>
  `<tr><td style="padding:0 0 16px;font-family:${FONT};font-size:14.5px;line-height:1.4;color:${muted ? MUTED : INK};">${html}</td></tr>`;

export const button = (href: string, label: string) =>
  `<tr><td style="padding:8px 0 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" bgcolor="${INK}" style="border-radius:6px;">
<a href="${escapeHtml(href)}" style="display:block;padding:10px 16px;font-family:${FONT};font-size:14.5px;line-height:16px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:6px;">${escapeHtml(label)}</a>
</td></tr>
</table>
</td></tr>`;

export function emailLayout({
  origin,
  title,
  preheader,
  heading,
  body,
  footer,
}: {
  /** Where the logo is served from: the app that sent the email. */
  origin: string;
  title: string;
  /** The inbox preview line. */
  preheader: string;
  heading: string;
  /** Rows (`<tr>`) built with paragraph() and button(). */
  body: string;
  footer: string;
}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#ffffff;color:${INK};font-family:${FONT};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
<tr><td align="center" style="padding:48px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:384px;">
<tr><td style="padding-bottom:40px;">
<img src="${escapeHtml(origin)}/email/logo.png" width="149" height="20" alt="dainemawer." style="display:block;border:0;width:149px;height:20px;">
</td></tr>
<tr><td style="padding-bottom:8px;font-family:${FONT};font-size:30px;line-height:1.2;font-weight:700;color:${INK};">${escapeHtml(heading)}</td></tr>
<tr><td style="height:16px;font-size:0;line-height:0;">&nbsp;</td></tr>
${body}
<tr><td style="padding-top:16px;"><div style="border-top:1px solid ${BORDER};font-size:0;line-height:0;">&nbsp;</div></td></tr>
<tr><td style="padding-top:16px;font-family:${FONT};font-size:12px;line-height:1.4;color:${MUTED};">${footer}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
