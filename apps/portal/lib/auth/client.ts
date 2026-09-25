import { createAuthClient } from "@neondatabase/auth/next";

// No arguments here — this talks to the same-origin /api/auth proxy
// (see app/api/auth/[...path]/route.ts), not to Neon directly.
export const authClient = createAuthClient();
