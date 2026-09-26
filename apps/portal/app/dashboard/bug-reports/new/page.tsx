import Link from "next/link";
import { createBugReport } from "@/lib/actions/bug-reports";

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
      <p className="m-0 text-faint text-xs">
        <Link href="/dashboard/bug-reports" className="text-faint">
          Bug reports
        </Link>{" "}
        / New
      </p>
      <h1 className="my-2 text-2xl text-ink">Report a bug</h1>
      <p className="mb-8 text-md text-muted">
        Tell us what went wrong and where.
      </p>

      <form action={createBugReport} className="max-w-lg">
        <label htmlFor="title" className="mb-1 block text-faint text-xs">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="e.g. Contact form sends twice"
          className="mb-6 w-full border-0 border-b border-divider bg-transparent pt-2 pb-2.5 text-md text-ink outline-none"
        />

        <label htmlFor="description" className="mb-1 block text-faint text-xs">
          What happened
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          placeholder="Which page were you on? What did you expect, and what happened instead?"
          className="mb-6 w-full border-0 border-b border-divider bg-transparent pt-2 pb-2.5 font-sans text-md text-ink outline-none"
        />

        <fieldset className="mb-8 border-0 p-0">
          <legend className="mb-2 text-faint text-xs">How bad is it?</legend>
          {SEVERITIES.map((severity, index) => (
            <label
              key={severity.value}
              className="flex items-baseline gap-3 py-2"
            >
              <input
                type="radio"
                name="severity"
                value={severity.value}
                defaultChecked={index === 1}
              />
              <span className="font-mono text-ink">{severity.label}</span>
              <span className="text-muted">{severity.hint}</span>
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          className="rounded-lg bg-ink px-6 py-3 text-base font-medium text-surface"
        >
          Send report
        </button>
      </form>
    </div>
  );
}
