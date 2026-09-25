"use server";

import { prisma } from "db";
import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/lib/data/current-user";

export async function createChangeRequest(formData: FormData) {
  const { project } = await getCurrentUserContext();
  if (!project) {
    throw new Error("No project assigned to this account yet.");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !description) {
    throw new Error("Title and details are both required.");
  }

  await prisma.changeRequest.create({
    data: { projectId: project.id, title, description },
  });

  redirect("/dashboard/change-requests");
}
