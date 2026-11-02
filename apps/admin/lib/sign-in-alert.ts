import { describeDevice } from "@/lib/user-agent";

// Whether a sign-in buzzes your phone (lib/audit.ts). Every sign-in still
// reaches Telegram and the audit log; this only decides the sound. Pure and
// tested in tests/sign-in-alert.test.ts.
//
// A passkey sign-in from a device and city you've signed in from in the
// last FAMILIAR_DAYS arrives silently: that's you, at your desk. Anything
// else buzzes: an email link (the recovery path), a new browser or OS, a
// new city, or a request without location headers.

export const FAMILIAR_DAYS = 90;

type Origin = { userAgent: string | null; location: string | null };

export function familiarSignIn(
  method: string | null | undefined,
  current: Origin,
  previous: Origin[],
): boolean {
  if (method !== "Passkey" || !current.location || !current.userAgent) {
    return false;
  }
  const device = describeDevice(current.userAgent);
  return previous.some(
    (p) =>
      p.location === current.location &&
      p.userAgent !== null &&
      describeDevice(p.userAgent) === device,
  );
}
