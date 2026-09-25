"use server";

import { prisma } from "db";
import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/lib/data/current-user";

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export async function createBugReport(formData: FormData) {
  const { project } = await getCurrentUserContext();
  if (!project) {
    throw new Error("No project assigned to this account yet.");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const severityInput = String(formData.get("severity") ?? "MEDIUM");
  const severity = SEVERITIES.includes(
    severityInput as (typeof SEVERITIES)[number],
  )
    ? (severityInput as (typeof SEVERITIES)[number])
    : "MEDIUM";

  if (!title || !description) {
    throw new Error("Title and description are both required.");
  }

  await prisma.bugReport.create({
    data: { projectId: project.id, title, description, severity },
  });

  redirect("/dashboard/bug-reports");
}
