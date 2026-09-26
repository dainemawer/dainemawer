import Link from "next/link";
import { EstimateTag } from "@/components/estimate-tag";
import { StatusBadge } from "@/components/status-badge";
import { getChangeRequests } from "@/lib/data/change-requests";
import { getCurrentUserContext } from "@/lib/data/current-user";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
}

export default async function ChangeRequestsPage() {
  const { project } = await getCurrentUserContext();
  if (!project) {
    return <p className="text-md text-muted">No project assigned yet.</p>;
  }

  const requests = await getChangeRequests(project.id);

  return (
    <div>
      <p className="m-0 text-faint text-xs">{project.name}</p>
      <h1 className="my-2 text-2xl text-ink">Change requests</h1>
      <p className="text-md text-muted">
        Everything you&rsquo;ve asked for, newest first.
      </p>
      <p className="mb-8">
        <Link
          href="/dashboard/change-requests/new"
          className="text-ink underline"
        >
          Submit a change request →
        </Link>
      </p>

      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left text-faint text-xs">
            <th className="pb-2 font-normal">Request</th>
            <th className="pb-2 font-normal">Status</th>
            <th className="pb-2 font-normal">Estimate</th>
            <th className="pb-2 font-normal">Updated</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id} className="border-divider border-t">
              <td className="py-3 text-ink">{request.title}</td>
              <td>
                <StatusBadge status={request.status} />
              </td>
              <td>
                <EstimateTag
                  sizeTier={request.sizeTier}
                  estimate={request.estimate}
                />
              </td>
              <td className="text-faint">{formatDate(request.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
