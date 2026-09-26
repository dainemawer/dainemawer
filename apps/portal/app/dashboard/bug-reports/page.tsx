import Link from "next/link";
import { SeverityLabel } from "@/components/severity-label";
import { StatusBadge } from "@/components/status-badge";
import { getBugReports } from "@/lib/data/bug-reports";
import { getCurrentUserContext } from "@/lib/data/current-user";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
}

export default async function BugReportsPage() {
  const { project } = await getCurrentUserContext();
  if (!project) {
    return <p className="text-md text-muted">No project assigned yet.</p>;
  }

  const bugs = await getBugReports(project.id);

  return (
    <div>
      <p className="m-0 text-faint text-xs">{project.name}</p>
      <h1 className="my-2 text-2xl text-ink">Bug reports</h1>
      <p className="mb-8">
        <Link href="/dashboard/bug-reports/new" className="text-ink underline">
          Report a bug →
        </Link>
      </p>

      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left text-faint text-xs">
            <th className="pb-2 font-normal">Bug</th>
            <th className="pb-2 font-normal">Status</th>
            <th className="pb-2 font-normal">Severity</th>
            <th className="pb-2 font-normal">Updated</th>
          </tr>
        </thead>
        <tbody>
          {bugs.map((bug) => (
            <tr key={bug.id} className="border-divider border-t">
              <td className="py-3 text-ink">{bug.title}</td>
              <td>
                <StatusBadge status={bug.status} />
              </td>
              <td>
                <SeverityLabel severity={bug.severity} />
              </td>
              <td className="text-faint">{formatDate(bug.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
