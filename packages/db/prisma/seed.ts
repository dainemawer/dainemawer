// Demo data for local development and early review — one client, one
// project, a timeline mirroring the design mockup's own demo content, and
// a couple of change requests / a bug report so every list has something
// to show. Not meant to survive into anything resembling production data.
import { estimateForTier, prisma } from "../src/index";

async function main() {
  const client = await prisma.client.create({
    data: { name: "Northwind" },
  });

  const project = await prisma.project.create({
    data: {
      clientId: client.id,
      name: "Website rebuild",
      status: "ACTIVE",
    },
  });

  await prisma.milestone.createMany({
    data: [
      {
        projectId: project.id,
        title: "Kickoff",
        dueDate: new Date("2026-08-04"),
        done: true,
      },
      {
        projectId: project.id,
        title: "Sitemap & content plan",
        dueDate: new Date("2026-08-15"),
        done: true,
      },
      {
        projectId: project.id,
        title: "Content migration",
        dueDate: new Date("2026-09-12"),
        done: true,
      },
      {
        projectId: project.id,
        title: "Page designs",
        dueDate: new Date("2026-09-19"),
        done: true,
      },
      {
        projectId: project.id,
        title: "Design sign-off",
        dueDate: new Date("2026-10-03"),
        done: false,
      },
      {
        projectId: project.id,
        title: "Build & testing",
        dueDate: new Date("2026-10-31"),
        done: false,
      },
      {
        projectId: project.id,
        title: "Launch",
        dueDate: new Date("2026-11-14"),
        done: false,
      },
    ],
  });

  const estimatedRequest = await prisma.changeRequest.create({
    data: {
      projectId: project.id,
      title: "Team page with bios",
      description:
        "Add a team page listing everyone with a short bio and a photo.",
      status: "ESTIMATED",
      sizeTier: "MEDIUM",
    },
  });
  const { hours, amount } = estimateForTier("MEDIUM");
  await prisma.estimate.create({
    data: {
      changeRequestId: estimatedRequest.id,
      hours,
      amount,
      confirmed: true,
    },
  });

  await prisma.changeRequest.create({
    data: {
      projectId: project.id,
      title: "Add French translation",
      description: "Translate all marketing pages into French.",
      status: "SUBMITTED",
    },
  });

  await prisma.bugReport.create({
    data: {
      projectId: project.id,
      title: "Mobile menu doesn't close",
      description:
        "On iOS Safari, tapping a link in the mobile menu doesn't close it afterward.",
      severity: "HIGH",
      status: "IN_PROGRESS",
    },
  });

  console.log(`Seeded client ${client.id}, project ${project.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
