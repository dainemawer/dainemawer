import Link from "next/link";
import { createChangeRequest } from "@/lib/actions/change-requests";
import { colors } from "@/lib/tokens";

export default function NewChangeRequestPage() {
  return (
    <div>
      <p style={{ color: colors.faint, margin: 0 }}>
        <Link href="/dashboard/change-requests" style={{ color: colors.faint }}>
          Change requests
        </Link>{" "}
        / New
      </p>
      <h1 style={{ color: colors.ink, margin: "0.5rem 0" }}>
        Submit a change request
      </h1>
      <p style={{ color: colors.muted, marginBottom: "2rem" }}>
        Describe what you&rsquo;d like changed. Daine will reply with an
        estimate before any work starts.
      </p>

      <form action={createChangeRequest} style={{ maxWidth: "32rem" }}>
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
          placeholder="e.g. Add a team page"
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
          Details
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          placeholder="What should change, and why? Links to pages or examples help."
          style={{
            width: "100%",
            padding: "0.5rem 0",
            border: "none",
            borderBottom: `1px solid ${colors.divider}`,
            marginBottom: "2rem",
            fontSize: "1rem",
            fontFamily: "inherit",
            background: "transparent",
            color: colors.ink,
          }}
        />

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
          Submit request
        </button>
      </form>
    </div>
  );
}
