import Link from "next/link";
import { createBugReport } from "@/lib/actions/bug-reports";
import { colors } from "@/lib/tokens";

const SEVERITIES = [
  { value: "LOW", label: "low", hint: "Cosmetic. Nothing is blocked." },
  {
    value: "MEDIUM",
    label: "medium",
    hint: "Something's wrong, but there's a workaround.",
  },
  {
    value: "HIGH",
    label: "high",
    hint: "A key page or feature isn't working.",
  },
  {
    value: "CRITICAL",
    label: "critical",
    hint: "The site is down, or customers can't buy or sign up.",
  },
] as const;

export default function NewBugReportPage() {
  return (
    <div>
      <p style={{ color: colors.faint, margin: 0 }}>
        <Link href="/dashboard/bug-reports" style={{ color: colors.faint }}>
          Bug reports
        </Link>{" "}
        / New
      </p>
      <h1 style={{ color: colors.ink, margin: "0.5rem 0" }}>Report a bug</h1>
      <p style={{ color: colors.muted, marginBottom: "2rem" }}>
        Tell us what went wrong and where.
      </p>

      <form action={createBugReport} style={{ maxWidth: "32rem" }}>
        <label
          htmlFor="title"
          style={{
            display: "block",
            color: colors.faint,
            marginBottom: "0.25rem",
          }}
        >
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="e.g. Contact form sends twice"
          style={{
            width: "100%",
            padding: "0.5rem 0",
            border: "none",
            borderBottom: `1px solid ${colors.divider}`,
            marginBottom: "1.5rem",
            fontSize: "1rem",
            background: "transparent",
            color: colors.ink,
          }}
        />

        <label
          htmlFor="description"
          style={{
            display: "block",
            color: colors.faint,
            marginBottom: "0.25rem",
          }}
        >
          What happened
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          placeholder="Which page were you on? What did you expect, and what happened instead?"
          style={{
            width: "100%",
            padding: "0.5rem 0",
            border: "none",
            borderBottom: `1px solid ${colors.divider}`,
            marginBottom: "1.5rem",
            fontSize: "1rem",
            fontFamily: "inherit",
            background: "transparent",
            color: colors.ink,
          }}
        />

        <fieldset style={{ border: "none", padding: 0, marginBottom: "2rem" }}>
          <legend style={{ color: colors.faint, marginBottom: "0.5rem" }}>
            How bad is it?
          </legend>
          {SEVERITIES.map((severity, index) => (
            <label
              key={severity.value}
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "baseline",
                padding: "0.5rem 0",
              }}
            >
              <input
                type="radio"
                name="severity"
                value={severity.value}
                defaultChecked={index === 1}
              />
              <span style={{ fontFamily: "monospace", color: colors.ink }}>
                {severity.label}
              </span>
              <span style={{ color: colors.muted }}>{severity.hint}</span>
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          style={{
            padding: "0.75rem 1.5rem",
            background: colors.ink,
            color: colors.surface,
            border: "none",
            borderRadius: "0.375rem",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Send report
        </button>
      </form>
    </div>
  );
}
