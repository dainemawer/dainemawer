import Link from "next/link";
import { getCurrentUserContext } from "@/lib/data/current-user";
import { getOverviewData } from "@/lib/data/overview";
import { colors } from "@/lib/tokens";

export default async function OverviewPage() {
  const { project } = await getCurrentUserContext();

  if (!project) {
    return (
      <div>
        <h1>Overview</h1>
        <p style={{ color: colors.muted }}>
          No project is assigned to your account yet. Reach out to Daine to get
          set up.
        </p>
      </div>
    );
  }

  const { milestoneProgress, openChangeRequests, openBugReports, activity } =
    await getOverviewData(project.id);

  return (
    <div>
      <p style={{ color: colors.faint, margin: 0 }}>Overview</p>
      <h1 style={{ color: colors.ink, margin: "0.5rem 0" }}>{project.name}</h1>
      <p style={{ color: colors.muted }}>
        {milestoneProgress.completed} of {milestoneProgress.total} milestones
        complete.{" "}
        <Link href="/dashboard/timeline" style={{ color: colors.ink }}>
          Full timeline →
        </Link>
      </p>

      <div style={{ display: "flex", gap: "3rem", margin: "2rem 0" }}>
        <div>
          <strong style={{ fontSize: "1.5rem", color: colors.ink }}>
            {openChangeRequests}
          </strong>{" "}
          <span style={{ color: colors.muted }}>change requests open</span>
        </div>
        <div>
          <strong style={{ fontSize: "1.5rem", color: colors.ink }}>
            {openBugReports}
          </strong>{" "}
          <span style={{ color: colors.muted }}>bug reports open</span>
        </div>
      </div>

      <p style={{ color: colors.faint, marginBottom: "0.5rem" }}>
        Need something?
      </p>
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "2rem" }}>
        <Link
          href="/dashboard/change-requests/new"
          style={{ color: colors.ink }}
        >
          Submit a change request →
        </Link>
        <Link href="/dashboard/bug-reports/new" style={{ color: colors.ink }}>
          Report a bug →
        </Link>
      </div>

      <p style={{ color: colors.faint, marginBottom: "0.5rem" }}>Activity</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {activity.map((item) => (
          <li
            key={item.id}
            style={{
              display: "grid",
              gridTemplateColumns: "6.25rem 1fr",
              gap: "1rem",
              padding: "0.5rem 0",
              borderBottom: `1px solid ${colors.divider}`,
              color: colors.muted,
            }}
          >
            <span style={{ color: colors.faint }}>
              {item.updatedAt.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
              })}
            </span>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
