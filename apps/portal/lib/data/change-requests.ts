import { prisma } from "db";

export async function getChangeRequests(projectId: string) {
  return prisma.changeRequest.findMany({
    where: { projectId },
    include: { estimate: true },
    orderBy: { createdAt: "desc" },
  });
}
