// Who may ask for an email sign-in link. Shared by the login form (which
// disables its button otherwise) and lib/auth.ts (which refuses the request
// outright, whatever the client sends). Pure, so the tests can import it.

export const SIGN_IN_DOMAIN = "dainemawer.com";

/**
 * True only for `something@dainemawer.com` exactly: no subdomains
 * (`a@mail.dainemawer.com`), no lookalikes (`a@dainemawer.com.evil.test`),
 * no second `@`. Case and surrounding spaces don't matter.
 */
export function canRequestLink(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const [local, domain, ...rest] = email.trim().toLowerCase().split("@");
  return (
    rest.length === 0 &&
    /^[^\s@]+$/.test(local ?? "") &&
    domain === SIGN_IN_DOMAIN
  );
}
