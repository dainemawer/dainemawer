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

  const fieldClassName =
    "mb-6 w-full border-0 border-b border-divider bg-transparent pt-2 pb-2.5 text-md text-ink outline-none";
  const labelClassName = "block text-xs text-faint";
  const buttonClassName =
    "rounded-lg bg-ink px-6 py-3 text-base font-medium text-surface disabled:opacity-60";

  if (status === "sent") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-surface p-8">
        <div className="w-full max-w-sm">
          <p className="m-0 text-xs text-faint">Portal</p>
          <h1 className="my-2 text-2xl text-ink">Check your email</h1>
          <p className="text-md text-muted">
            We sent a sign-in link to {email}. It works once and expires
            shortly.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface p-8">
      <div className="w-full max-w-sm">
        <p className="m-0 text-xs text-faint">Portal</p>
        <h1 className="my-2 text-2xl text-ink">Sign in</h1>
        <p className="mb-8 text-md text-muted">
          Enter your email to access your project.
        </p>

        {mode === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col">
            <label className={labelClassName} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className={fieldClassName}
            />
            <label className={labelClassName} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className={fieldClassName}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className={buttonClassName}
            >
              {status === "sending" ? "Signing in…" : "Sign in"}
            </button>
            {status === "error" && (
              <p className="mt-3 text-xs text-error" role="alert">
                {errorMessage}
              </p>
            )}
          </form>
        ) : (
          <form onSubmit={handleMagicLinkSubmit} className="flex flex-col">
            <label className={labelClassName} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className={fieldClassName}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className={buttonClassName}
            >
              {status === "sending" ? "Sending…" : "Email me a sign-in link"}
            </button>
            {status === "error" && (
              <p className="mt-3 text-xs text-error" role="alert">
                {errorMessage}
              </p>
            )}
          </form>
        )}

        <p className="mt-4 text-xs text-faint">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "password" ? "magic-link" : "password");
              setStatus("idle");
              setErrorMessage("");
            }}
            className="border-0 bg-transparent p-0 text-xs text-ink underline"
          >
            {mode === "password"
              ? "Use a sign-in link instead"
              : "Use a password instead"}
          </button>
        </p>
        <p className="mt-4 text-xs text-faint">
          Access is by invitation. Need help?{" "}
          <a href="mailto:hello@dainemawer.com" className="text-ink">
            hello@dainemawer.com
          </a>
        </p>
      </div>
    </main>
  );
}
