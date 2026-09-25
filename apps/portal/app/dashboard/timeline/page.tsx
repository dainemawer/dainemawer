import { getCurrentUserContext } from "@/lib/data/current-user";
import { getMilestones } from "@/lib/data/milestones";
import { colors } from "@/lib/tokens";

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
    return <p style={{ color: colors.muted }}>No project assigned yet.</p>;
  }

  const milestones = await getMilestones(project.id);

  return (
    <div>
      <p style={{ color: colors.faint, margin: 0 }}>{project.name}</p>
      <h1 style={{ color: colors.ink, margin: "0.5rem 0 2rem" }}>Timeline</h1>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {milestones.map((milestone) => (
          <li
            key={milestone.id}
            style={{
              display: "grid",
              gridTemplateColumns: "6.25rem 1fr",
              gap: "1rem",
              padding: "1rem 0",
              borderBottom: `1px solid ${colors.divider}`,
            }}
          >
            <span style={{ color: colors.faint }}>
              {formatDate(milestone.dueDate)}
            </span>
            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span style={{ fontFamily: "monospace", color: colors.muted }}>
                  {milestone.done ? "●" : "○"}
                </span>
                <strong style={{ color: colors.ink }}>{milestone.title}</strong>
              </div>
              <p style={{ color: colors.muted, margin: "0.25rem 0 0" }}>
                {milestone.done ? "complete" : "planned"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
