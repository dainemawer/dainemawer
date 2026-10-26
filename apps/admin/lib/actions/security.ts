"use server";

import { headers } from "next/headers";
import { audit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { errorMessage } from "@/lib/errors";
import { requireSession } from "@/lib/session";

/** Signs out every session but this one: a lost laptop, a sign-in you didn't make. */
export async function signOutOtherSessions(): Promise<{ error?: string }> {
  await requireSession();
  try {
    await auth.api.revokeOtherSessions({ headers: await headers() });
  } catch (error) {
    return { error: errorMessage(error, "Couldn't sign out other sessions.") };
  }
  await audit("sessions-revoked");
  return {};
}
