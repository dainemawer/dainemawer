import { prisma } from "db";

export async function getBugReports(projectId: string) {
  return prisma.bugReport.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}
