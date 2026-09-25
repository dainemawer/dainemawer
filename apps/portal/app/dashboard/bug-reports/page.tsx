import Link from "next/link";
import { SeverityLabel } from "@/components/severity-label";
import { StatusBadge } from "@/components/status-badge";
import { getBugReports } from "@/lib/data/bug-reports";
import { getCurrentUserContext } from "@/lib/data/current-user";
import { colors } from "@/lib/tokens";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
}

export default async function BugReportsPage() {
  const { project } = await getCurrentUserContext();
  if (!project) {
    return <p style={{ color: colors.muted }}>No project assigned yet.</p>;
  }

  const bugs = await getBugReports(project.id);

  return (
    <div>
      <p style={{ color: colors.faint, margin: 0 }}>{project.name}</p>
      <h1 style={{ color: colors.ink, margin: "0.5rem 0" }}>Bug reports</h1>
      <p style={{ marginBottom: "2rem" }}>
        <Link href="/dashboard/bug-reports/new" style={{ color: colors.ink }}>
          Report a bug →
        </Link>
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", color: colors.faint }}>
            <th style={{ fontWeight: 400, paddingBottom: "0.5rem" }}>Bug</th>
            <th style={{ fontWeight: 400, paddingBottom: "0.5rem" }}>Status</th>
            <th style={{ fontWeight: 400, paddingBottom: "0.5rem" }}>
              Severity
            </th>
            <th style={{ fontWeight: 400, paddingBottom: "0.5rem" }}>
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {bugs.map((bug) => (
            <tr
              key={bug.id}
              style={{ borderTop: `1px solid ${colors.divider}` }}
            >
              <td style={{ padding: "0.75rem 0", color: colors.ink }}>
                {bug.title}
              </td>
              <td>
                <StatusBadge status={bug.status} />
              </td>
              <td>
                <SeverityLabel severity={bug.severity} />
              </td>
              <td style={{ color: colors.faint }}>
                {formatDate(bug.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
