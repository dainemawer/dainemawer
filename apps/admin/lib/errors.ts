/**
 * A failure whose message is written to be shown: a rule ("A sent invoice
 * can't be edited.") or an outside service's own status. Server Actions show
 * these as they are; anything else (a database error, a bug) is logged and
 * replaced with a generic message, so internals never reach the page.
 */
export class UserError extends Error {}

export function errorMessage(error: unknown, fallback: string) {
  if (error instanceof UserError) return error.message;
  console.error(fallback, error);
  return fallback;
}
