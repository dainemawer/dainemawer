import { prisma } from "db";

export async function getOverviewData(projectId: string) {
  const [project, milestones, openChangeRequests, openBugReports] =
    await Promise.all([
      prisma.project.findUniqueOrThrow({ where: { id: projectId } }),
      prisma.milestone.findMany({
        where: { projectId },
        orderBy: { dueDate: "asc" },
      }),
      prisma.changeRequest.count({
        where: { projectId, status: { not: "DONE" } },
      }),
      prisma.bugReport.count({
        where: { projectId, status: { not: "DONE" } },
      }),
    ]);

  const completedMilestones = milestones.filter((m) => m.done).length;

  const [recentChangeRequests, recentBugReports, recentMilestones] =
    await Promise.all([
      prisma.changeRequest.findMany({
        where: { projectId },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.bugReport.findMany({
        where: { projectId },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.milestone.findMany({
        where: { projectId, done: true },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
    ]);

  // A merged, most-recent-first feed across the three sources — there's no
  // dedicated activity/event table, so this is derived rather than stored.
  // Simpler than the design mockup's per-event copy (e.g. distinguishing
  // "estimate ready" from "status changed"); good enough for the MVP, and
  // a real activity log is a reasonable later addition, not a rewrite.
  const activity = [
    ...recentChangeRequests.map((r) => ({
      id: `change-request-${r.id}`,
      updatedAt: r.updatedAt,
      text: `“${r.title}” is ${r.status.toLowerCase().replace("_", " ")}.`,
    })),
    ...recentBugReports.map((r) => ({
      id: `bug-report-${r.id}`,
      updatedAt: r.updatedAt,
      text: `“${r.title}” is ${r.status.toLowerCase().replace("_", " ")}.`,
    })),
    ...recentMilestones.map((m) => ({
      id: `milestone-${m.id}`,
      updatedAt: m.updatedAt,
      text: `Milestone complete: ${m.title}.`,
    })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 6);

  return {
    project,
    milestoneProgress: {
      completed: completedMilestones,
      total: milestones.length,
    },
    openChangeRequests,
    openBugReports,
    activity,
  };
}
