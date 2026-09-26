"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic-link" | "password">("password");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleMagicLinkSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setStatus("sending");
    try {
      // Must be absolute: verification happens on Neon's hosted auth
      // domain, not ours, so a relative path can't be resolved against
      // our origin — it gets treated as relative to Neon's own domain
      // instead, and the post-verify redirect 404s there.
      //
      // NOTE (2026-09-26): Magic Link is temporarily unusable — Neon's
      // beta SDK (@neondatabase/auth 0.5.0-beta) never sets the session
      // challenge cookie its own cross-origin verifier exchange depends
      // on, so clicking the emailed link never establishes a local
      // session no matter what. Confirmed via curl: the sign-in POST
      // response carries no Set-Cookie at all. Password sign-in below is
      // the working path until Neon fixes this upstream.
      const { error } = await authClient.signIn.magicLink({
        email,
        callbackURL: `${window.location.origin}/dashboard`,
      });
      if (error) {
        setStatus("error");
        setErrorMessage(error.message ?? "Something went wrong.");
        return;
      }
      setStatus("sent");
    } catch (caught) {
      setStatus("error");
      setErrorMessage(
        caught instanceof Error ? caught.message : "Something went wrong.",
      );
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        setStatus("error");
        setErrorMessage(error.message ?? "Something went wrong.");
        return;
      }
      window.location.href = "/dashboard";
    } catch (caught) {
      setStatus("error");
      setErrorMessage(
        caught instanceof Error ? caught.message : "Something went wrong.",
      );
    }
  }

  if (status === "sent") {
    return (
      <main style={styles.main}>
        <div style={styles.card}>
          <p style={styles.eyebrow}>Portal</p>
          <h1 style={styles.heading}>Check your email</h1>
          <p style={styles.subtext}>
            We sent a sign-in link to {email}. It works once and expires
            shortly.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>Portal</p>
        <h1 style={styles.heading}>Sign in</h1>
        <p style={styles.subtext}>Enter your email to access your project.</p>

        {mode === "password" ? (
          <form onSubmit={handlePasswordSubmit} style={styles.form}>
            <label style={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              style={styles.input}
            />
            <label style={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              style={styles.input}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              style={styles.button}
            >
              {status === "sending" ? "Signing in…" : "Sign in"}
            </button>
            {status === "error" && (
              <p style={styles.error} role="alert">
                {errorMessage}
              </p>
            )}
          </form>
        ) : (
          <form onSubmit={handleMagicLinkSubmit} style={styles.form}>
            <label style={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              style={styles.input}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              style={styles.button}
            >
              {status === "sending" ? "Sending…" : "Email me a sign-in link"}
            </button>
            {status === "error" && (
              <p style={styles.error} role="alert">
                {errorMessage}
              </p>
            )}
          </form>
        )}

        <p style={styles.footnote}>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "password" ? "magic-link" : "password");
              setStatus("idle");
              setErrorMessage("");
            }}
            style={styles.linkButton}
          >
            {mode === "password"
              ? "Use a sign-in link instead"
              : "Use a password instead"}
          </button>
        </p>
        <p style={styles.footnote}>
          Access is by invitation. Need help?{" "}
          <a href="mailto:hello@dainemawer.com" style={styles.link}>
            hello@dainemawer.com
          </a>
        </p>
      </div>
    </main>
  );
}

// Inline for now — packages/ui (the shared design system) doesn't exist
// yet. Colors match apps/blog/app/globals.css exactly: #111 ink, #6b6b6b
// muted (~5.3:1), #767676 is the AA floor (~4.5:1) and nothing here goes
// lighter than that.
const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    padding: "2rem",
  },
  card: {
    width: "100%",
    maxWidth: "24rem",
  },
  eyebrow: {
    color: "#767676",
    fontSize: "0.84375rem",
    margin: 0,
  },
  heading: {
    color: "#111111",
    fontSize: "1.875rem",
    margin: "0.5rem 0",
  },
  subtext: {
    color: "#6b6b6b",
    fontSize: "1.0625rem",
    margin: "0 0 2rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    color: "#767676",
    fontSize: "0.84375rem",
  },
  input: {
    padding: "0.75rem 0",
    border: "none",
    borderBottom: "1px solid #cfcfcf",
    fontSize: "1rem",
    color: "#111111",
    outline: "none",
    marginBottom: "1.5rem",
    background: "transparent",
  },
  button: {
    padding: "0.75rem 1rem",
    background: "#111111",
    color: "#ffffff",
    border: "none",
    borderRadius: "0.375rem",
    fontSize: "1rem",
    cursor: "pointer",
  },
  error: {
    color: "#b3261e",
    fontSize: "0.84375rem",
  },
  footnote: {
    color: "#767676",
    fontSize: "0.84375rem",
    marginTop: "1rem",
  },
  linkButton: {
    background: "none",
    border: "none",
    padding: 0,
    color: "#111111",
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: "inherit",
  },
  link: {
    color: "#111111",
  },
};
