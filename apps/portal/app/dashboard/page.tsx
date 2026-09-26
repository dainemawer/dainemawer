import Link from "next/link";
import { getCurrentUserContext } from "@/lib/data/current-user";
import { getOverviewData } from "@/lib/data/overview";

export default async function OverviewPage() {
  const { project } = await getCurrentUserContext();

  if (!project) {
    return (
      <div>
        <h1 className="text-2xl text-ink">Overview</h1>
        <p className="text-md text-muted">
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
      <p className="m-0 text-faint text-xs">Overview</p>
      <h1 className="my-2 text-2xl text-ink">{project.name}</h1>
      <p className="text-md text-muted">
        {milestoneProgress.completed} of {milestoneProgress.total} milestones
        complete.{" "}
        <Link href="/dashboard/timeline" className="text-ink underline">
          Full timeline →
        </Link>
      </p>

      <div className="my-8 flex gap-12">
        <div>
          <strong className="text-2xl text-ink">{openChangeRequests}</strong>{" "}
          <span className="text-muted">change requests open</span>
        </div>
        <div>
          <strong className="text-2xl text-ink">{openBugReports}</strong>{" "}
          <span className="text-muted">bug reports open</span>
        </div>
      </div>

      <p className="mb-2 text-faint text-xs">Need something?</p>
      <div className="mb-8 flex gap-6">
        <Link
          href="/dashboard/change-requests/new"
          className="text-ink underline"
        >
          Submit a change request →
        </Link>
        <Link href="/dashboard/bug-reports/new" className="text-ink underline">
          Report a bug →
        </Link>
      </div>

      <p className="mb-2 text-faint text-xs">Activity</p>
      <ul className="m-0 list-none p-0">
        {activity.map((item) => (
          <li
            key={item.id}
            className="grid grid-cols-meta gap-4 border-divider border-b py-2 text-muted"
          >
            <span className="text-faint">
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
