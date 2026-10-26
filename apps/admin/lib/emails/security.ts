import {
  button,
  emailLayout,
  escapeHtml,
  paragraph,
} from "@/lib/emails/layout";

type Origin = {
  ipAddress: string | null;
  userAgent: string | null;
  location: string | null;
};

/** Sent on every sign-in, so one you didn't make doesn't go unnoticed. */
export function signInAlertEmail({
  origin,
  method,
  from,
  at,
}: {
  origin: string;
  method: string;
  from: Origin;
  at: Date;
}) {
  const { host } = new URL(origin);
  const when = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(at);
  const where = [from.location, from.ipAddress].filter(Boolean).join(" · ");
  const facts = [
    `When: ${when}`,
    `How: ${method}`,
    where ? `Where: ${where}` : null,
    from.userAgent ? `Device: ${from.userAgent}` : null,
  ].filter((line): line is string => Boolean(line));
  const text = `New sign-in to ${host}.\n\n${facts.join("\n")}\n\nIf this was you, there's nothing to do. If it wasn't, open ${origin}/settings, choose "Sign out other sessions", and remove any passkey you don't recognise.`;
  const html = emailLayout({
    origin,
    title: "New sign-in",
    preheader: `${method}${from.location ? ` from ${from.location}` : ""}, ${when}.`,
    heading: "New sign-in",
    body:
      paragraph(`Someone just signed in to ${escapeHtml(host)}.`) +
      paragraph(facts.map(escapeHtml).join("<br>"), false) +
      paragraph(
        "If this was you, there's nothing to do. If it wasn't, sign out every other session and remove any passkey you don't recognise.",
      ) +
      button(`${origin}/settings#security`, "Review security"),
    footer: "Sent for every sign-in to the admin.",
  });
  return { subject: `New sign-in to ${host}`, text, html };
}

/** A scheduled job (cron) threw: nothing else would tell you. */
export function cronFailedEmail({
  origin,
  job,
  message,
}: {
  origin: string;
  job: string;
  message: string;
}) {
  const { host } = new URL(origin);
  const text = `${job} failed on ${host}:\n\n${message}\n\nIt runs again tomorrow. The function logs in Vercel have the details.`;
  const html = emailLayout({
    origin,
    title: `${job} failed`,
    preheader: message,
    heading: `${job} failed`,
    body:
      paragraph(`This morning's run on ${escapeHtml(host)} stopped with:`) +
      paragraph(escapeHtml(message), false) +
      paragraph(
        "It runs again tomorrow. The function logs in Vercel have the details.",
      ),
    footer: "Sent when a scheduled job fails.",
  });
  return { subject: `${job} failed`, text, html };
}
