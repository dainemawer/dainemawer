import { NextResponse } from "next/server";
import { Resend } from "resend";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_SEGMENT_ID;

  if (!apiKey || !segmentId) {
    console.error(
      "Newsletter signup attempted without RESEND_API_KEY/RESEND_SEGMENT_ID configured",
    );
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  // audienceId is deprecated in Resend's API in favor of segments — see
  // https://resend.com/docs/dashboard/segments/migrating-from-audiences-to-segments
  const { error } = await resend.contacts.create({
    email,
    segments: [{ id: segmentId }],
    unsubscribed: false,
  });

  if (error) {
    console.error("Resend contact creation failed", error);
    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
