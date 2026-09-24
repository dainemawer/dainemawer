"use client";

import { type FormEvent, useId, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { contact, DEFAULT_REASON, reasonByValue } from "@/lib/contact";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_MESSAGE = 20;

const ERROR_COPY: Record<string, string> = {
  missing_name: "Enter your name.",
  invalid_email: "Enter a valid email address.",
  message_too_short: `Give me a bit more to go on — at least ${MIN_MESSAGE} characters.`,
  rate_limited: "That's a few messages in a short window. Try again later.",
  not_configured: "The form isn't sending right now — email me directly.",
  provider_error: "That didn't send. Try again, or email me directly.",
  network_error: "That didn't send. Try again, or email me directly.",
};

// The design draws every field as a hairline underline with no box. `field`
// is a dedicated token rather than `divider` because the underline is the
// only thing marking the control out (see app/globals.css).
const fieldClass =
  "w-full border-field border-b bg-transparent py-2 text-ink text-md outline-none placeholder:text-faint focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/15";
const labelClass = "text-faint text-sm sm:pt-2 sm:text-right";
// Matches MetaRow's own grid so the form's rows line up with the label
// column used by every other row on the page.
const rowClass =
  "grid grid-cols-1 gap-x-12 gap-y-1.5 sm:grid-cols-meta sm:items-start sm:gap-y-0";

export function ContactForm() {
  const [reason, setReason] = useState(DEFAULT_REASON);
  const [status, setStatus] = useState<
    "idle" | "pending" | "error" | "success"
  >("idle");
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [sentName, setSentName] = useState("");

  const baseId = useId();
  const ids = {
    name: `${baseId}-name`,
    email: `${baseId}-email`,
    post: `${baseId}-post`,
    message: `${baseId}-message`,
    company: `${baseId}-company`,
    error: `${baseId}-error`,
  };

  const active = reasonByValue(reason) ?? contact.reasons[0];

  function fail(reasonCode: string) {
    setStatus("error");
    setErrorReason(reasonCode);
    trackEvent("contact_form_failed", { reason: reasonCode });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      post: String(data.get("post") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      reason,
      company: String(data.get("company") ?? ""),
    };

    if (!payload.name) return fail("missing_name");
    if (!EMAIL_PATTERN.test(payload.email)) return fail("invalid_email");
    if (payload.message.length < MIN_MESSAGE) return fail("message_too_short");

    trackEvent("contact_form_submitted", { reason });
    setStatus("pending");
    setErrorReason(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const { error } = await response.json().catch(() => ({}));
        fail(error ?? "network_error");
        return;
      }
      setSentName(payload.name);
      form.reset();
      setStatus("success");
      trackEvent("contact_form_succeeded", { reason });
    } catch {
      fail("network_error");
    }
  }

  if (status === "success") {
    const firstName = sentName.split(" ")[0];
    return (
      <div className={rowClass}>
        <div className={`${labelClass} sm:pt-0`}>Sent</div>
        <output className="flex flex-col gap-2">
          <span className="text-ink text-xl tracking-tight">
            {firstName
              ? `Thanks, ${firstName} — it's in.`
              : "Thanks — it's in."}
          </span>
          <span className="text-base text-muted leading-normal">
            Replies usually take two working days.{" "}
            <button
              type="button"
              onClick={() => {
                setStatus("idle");
                setSentName("");
              }}
              className="cursor-pointer text-ink underline decoration-divider underline-offset-2 hover:decoration-ink focus-visible:decoration-ink"
            >
              Send another
            </button>
          </span>
        </output>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-11" noValidate>
      {/* Native radios rather than the design's role="radio" spans: this way
          arrow-key navigation, the checked state and the group label all come
          from the platform, and selection is never signalled by opacity
          alone. The input is visually hidden but still focusable, so the
          focus ring lands on the label text the user actually sees. */}
      <fieldset className={rowClass}>
        <legend className={`${labelClass} sm:float-left sm:w-25`}>About</legend>
        <div className="flex flex-wrap gap-x-6.5 gap-y-3 text-base">
          {contact.reasons.map((item) => (
            <label
              key={item.value}
              // The selected option is underlined as well as darkened: the
              // design signalled it with opacity alone, which is both a
              // colour-only cue (WCAG 1.4.1) and, at 0.32, unreadable.
              className={`cursor-pointer underline-offset-6 transition-colors duration-140 ease-out hover:text-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink/15 ${
                reason === item.value
                  ? "text-ink underline decoration-ink"
                  : "text-muted no-underline"
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={item.value}
                checked={reason === item.value}
                onChange={() => setReason(item.value)}
                className="sr-only"
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>

      {active.needsPost && (
        <div className={rowClass}>
          <label htmlFor={ids.post} className={labelClass}>
            Which post
          </label>
          <input
            id={ids.post}
            name="post"
            type="text"
            maxLength={300}
            placeholder="Title or link"
            className={fieldClass}
          />
        </div>
      )}

      <div className={rowClass}>
        <label htmlFor={ids.name} className={labelClass}>
          Name
        </label>
        <input
          id={ids.name}
          name="name"
          type="text"
          required
          autoComplete="name"
          maxLength={100}
          placeholder="Your name"
          aria-invalid={errorReason === "missing_name"}
          aria-describedby={status === "error" ? ids.error : undefined}
          className={`${fieldClass} sm:max-w-130`}
        />
      </div>

      <div className={rowClass}>
        <label htmlFor={ids.email} className={labelClass}>
          Email
        </label>
        <input
          id={ids.email}
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          placeholder="So I can reply"
          aria-invalid={errorReason === "invalid_email"}
          aria-describedby={status === "error" ? ids.error : undefined}
          className={`${fieldClass} sm:max-w-130`}
        />
      </div>

      <div className={rowClass}>
        <label htmlFor={ids.message} className={labelClass}>
          Message
        </label>
        <textarea
          id={ids.message}
          name="message"
          required
          rows={6}
          maxLength={5000}
          placeholder={active.hint}
          aria-invalid={errorReason === "message_too_short"}
          aria-describedby={status === "error" ? ids.error : undefined}
          className={`${fieldClass} resize-y text-base leading-relaxed`}
        />
      </div>

      {/* Honeypot. Hidden from sight, from the tab order and from assistive
          tech, so nothing but a DOM-scraping bot will ever fill it in. Not
          `display: none`, which some bots skip. */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor={ids.company}>Company</label>
        <input
          id={ids.company}
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className={rowClass}>
        <span className="hidden sm:block" />
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-5.5 gap-y-2">
            <button
              type="submit"
              disabled={status === "pending"}
              className="cursor-pointer text-base text-ink hover:opacity-60 focus-visible:opacity-60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "pending" ? "Sending…" : "Send message →"}
            </button>
            <span className="text-faint text-xs">
              No newsletter sign-up. Just an email to me.
            </span>
          </div>
          {status === "error" && (
            <p id={ids.error} role="alert" className="text-red-700 text-sm">
              {ERROR_COPY[errorReason ?? ""] ??
                "That didn't send. Try again, or email me directly."}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
