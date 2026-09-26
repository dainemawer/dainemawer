import { getCurrentUserContext } from "@/lib/data/current-user";
import { getMilestones } from "@/lib/data/milestones";

function formatDate(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function TimelinePage() {
  const { project } = await getCurrentUserContext();
  if (!project) {
    return <p className="text-md text-muted">No project assigned yet.</p>;
  }

  const milestones = await getMilestones(project.id);

  return (
    <div>
      <p className="m-0 text-faint text-xs">{project.name}</p>
      <h1 className="my-2 mb-8 text-2xl text-ink">Timeline</h1>

      <ul className="m-0 list-none p-0">
        {milestones.map((milestone) => (
          <li
            key={milestone.id}
            className="grid grid-cols-meta gap-4 border-divider border-b py-4"
          >
            <span className="text-faint">{formatDate(milestone.dueDate)}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted">
                  {milestone.done ? "●" : "○"}
                </span>
                <strong className="text-ink">{milestone.title}</strong>
              </div>
              <p className="mt-1 text-muted">
                {milestone.done ? "complete" : "planned"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
