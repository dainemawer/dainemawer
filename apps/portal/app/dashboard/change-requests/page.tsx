import Link from "next/link";
import { EstimateTag } from "@/components/estimate-tag";
import { StatusBadge } from "@/components/status-badge";
import { getChangeRequests } from "@/lib/data/change-requests";
import { getCurrentUserContext } from "@/lib/data/current-user";
import { colors } from "@/lib/tokens";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
}

export default async function ChangeRequestsPage() {
  const { project } = await getCurrentUserContext();
  if (!project) {
    return <p style={{ color: colors.muted }}>No project assigned yet.</p>;
  }

  const requests = await getChangeRequests(project.id);

  return (
    <div>
      <p style={{ color: colors.faint, margin: 0 }}>{project.name}</p>
      <h1 style={{ color: colors.ink, margin: "0.5rem 0" }}>Change requests</h1>
      <p style={{ color: colors.muted }}>
        Everything you&rsquo;ve asked for, newest first.
      </p>
      <p style={{ marginBottom: "2rem" }}>
        <Link
          href="/dashboard/change-requests/new"
          style={{ color: colors.ink }}
        >
          Submit a change request →
        </Link>
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", color: colors.faint }}>
            <th style={{ fontWeight: 400, paddingBottom: "0.5rem" }}>
              Request
            </th>
            <th style={{ fontWeight: 400, paddingBottom: "0.5rem" }}>Status</th>
            <th style={{ fontWeight: 400, paddingBottom: "0.5rem" }}>
              Estimate
            </th>
            <th style={{ fontWeight: 400, paddingBottom: "0.5rem" }}>
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr
              key={request.id}
              style={{ borderTop: `1px solid ${colors.divider}` }}
            >
              <td style={{ padding: "0.75rem 0", color: colors.ink }}>
                {request.title}
              </td>
              <td>
                <StatusBadge status={request.status} />
              </td>
              <td>
                <EstimateTag
                  sizeTier={request.sizeTier}
                  estimate={request.estimate}
                />
              </td>
              <td style={{ color: colors.faint }}>
                {formatDate(request.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
