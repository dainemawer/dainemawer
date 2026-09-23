"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  useSetSubscribeModalOpen,
  useSubscribeModalOpen,
} from "./subscribe-modal-context";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SubscribeModal() {
  const open = useSubscribeModalOpen();
  const setOpen = useSetSubscribeModalOpen();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "pending" | "error" | "success"
  >("idle");
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const emailId = `${titleId}-email`;
  const errorId = `${titleId}-error`;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => {
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  function close() {
    setOpen(false);
    setEmail("");
    setStatus("idle");
    setErrorReason(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email)) {
      setStatus("error");
      setErrorReason("invalid_email");
      trackEvent("newsletter_signup_failed", { reason: "invalid_email" });
      return;
    }
    trackEvent("newsletter_signup_submitted");
    setStatus("pending");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const { error } = await response.json().catch(() => ({}));
        setStatus("error");
        setErrorReason(error ?? "unknown");
        trackEvent("newsletter_signup_failed", {
          reason: error ?? "unknown",
        });
        return;
      }
      setStatus("success");
      trackEvent("newsletter_signup_succeeded");
    } catch {
      setStatus("error");
      setErrorReason("network_error");
      trackEvent("newsletter_signup_failed", { reason: "network_error" });
    }
  }

  return (
    // Click-outside-to-close is a supplementary mouse affordance; Escape
    // (handled in SubscribeModalProvider) is the keyboard-equivalent way
    // to dismiss this overlay.
    // biome-ignore lint/a11y/noStaticElementInteractions: see comment above
    // biome-ignore lint/a11y/useKeyWithClickEvents: see comment above
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="fixed inset-0 z-60 flex items-center justify-center bg-overlay px-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-100 rounded-palette bg-surface p-5 shadow-palette sm:p-7"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 id={titleId} className="text-ink text-lg tracking-tight">
            Subscribe
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="-m-2 cursor-pointer p-2 font-mono text-2xs text-faint hover:text-ink focus-visible:text-ink"
          >
            esc
          </button>
        </div>
        <p className="mt-2 text-muted text-sm">
          New posts, no spam. Unsubscribe anytime.
        </p>

        {status === "success" ? (
          <output className="mt-6 block text-ink text-md">
            You're on the list.
          </output>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 flex flex-col gap-3"
            noValidate
          >
            <label htmlFor={emailId} className="sr-only">
              Email address
            </label>
            <input
              ref={inputRef}
              id={emailId}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setStatus("idle");
                setErrorReason(null);
              }}
              placeholder="you@example.com"
              aria-invalid={status === "error"}
              aria-describedby={status === "error" ? errorId : undefined}
              className="rounded-md border border-divider bg-transparent px-3 py-2 text-ink text-md outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-ink/15"
            />
            {status === "error" && (
              <p id={errorId} role="alert" className="text-red-600 text-xs">
                {errorReason === "invalid_email"
                  ? "Enter a valid email address."
                  : "Something went wrong — try again in a moment."}
              </p>
            )}
            <button
              type="submit"
              disabled={status === "pending"}
              className="cursor-pointer rounded-md bg-ink px-3 py-2 text-sm text-surface hover:opacity-90 focus-visible:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "pending" ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
