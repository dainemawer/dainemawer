import { prisma } from "db";

export async function getMilestones(projectId: string) {
  return prisma.milestone.findMany({
    where: { projectId },
    orderBy: { dueDate: "asc" },
  });
}
