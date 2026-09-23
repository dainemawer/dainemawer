import { NextResponse } from "next/server";
import { Resend } from "resend";
import { DEFAULT_REASON, reasonByValue } from "@/lib/contact";
import { site } from "@/lib/site";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_NAME = 100;
const MAX_EMAIL = 254; // RFC 5321 maximum path length
const MAX_POST = 300;
const MAX_MESSAGE = 5000;
const MIN_MESSAGE = 20;

// Per-IP fixed window. In-memory, so it resets on deploy and isn't shared
// between serverless instances — which makes it a speed bump for casual
// floods, not a security control. The honeypot below stops the bulk of
// automated submissions, and Resend applies its own sending limits on top.
// Worth replacing with a durable store if this ever gets real abuse.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    // Opportunistic sweep: without it the map grows unbounded across the
    // lifetime of a warm instance.
    if (hits.size > 1000) {
      for (const [key, value] of hits) {
        if (now > value.resetAt) hits.delete(key);
      }
    }
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

function field(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);

  // Honeypot: a field hidden from humans (and from assistive tech via
  // aria-hidden + tabindex -1) that a form-filling bot populates because it
  // only reads the DOM. Answer 200 rather than 400 so a bot gets no signal
  // about which field gave it away, and nothing is sent.
  if (field(body?.company, 200) !== "") {
    return NextResponse.json({ ok: true });
  }

  const name = field(body?.name, MAX_NAME);
  const email = field(body?.email, MAX_EMAIL);
  const post = field(body?.post, MAX_POST);
  const message = field(body?.message, MAX_MESSAGE);
  // Falls back to the default rather than 400ing: the reason only labels the
  // email, so an unrecognised value is never worth losing a real message over.
  const reason = reasonByValue(field(body?.reason, 40)) ?? {
    ...reasonByValue(DEFAULT_REASON),
    label: "Speaking",
  };

  if (!name) {
    return NextResponse.json({ error: "missing_name" }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (message.length < MIN_MESSAGE) {
    return NextResponse.json({ error: "message_too_short" }, { status: 400 });
  }

  // Checked here rather than at the top of the handler on purpose. Config is
  // the site's problem, not the sender's: if it runs first, a deploy missing
  // an env var answers every request with `not_configured`, so a bot learns
  // nothing from the honeypot and a real person gets a 500 where they should
  // have been told their email address was malformed. This way the only
  // request that can surface a config fault is one that would otherwise have
  // sent successfully.
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !from) {
    console.error(
      "Contact form submitted without RESEND_API_KEY/CONTACT_FROM_EMAIL configured",
    );
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  // `from` has to be a domain verified in Resend, so it can't be the
  // sender's own address. Their address goes in replyTo instead, which
  // makes a reply from the inbox go back to them directly.
  const { error } = await resend.emails.send({
    from,
    to: site.email,
    replyTo: email,
    subject: `[dainemawer.com] ${reason.label} — ${name}`,
    text: [
      `From: ${name} <${email}>`,
      `About: ${reason.label}`,
      post ? `Post: ${post}` : null,
      "",
      message,
    ]
      .filter((line) => line !== null)
      .join("\n"),
  });

  if (error) {
    console.error("Resend contact email failed", error);
    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
