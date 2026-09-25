import { prisma } from "db";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export type CurrentUserContext = {
  userId: string;
  email: string;
  role: "ADMIN" | "CLIENT";
  project: Awaited<ReturnType<typeof prisma.project.findFirst>> | null;
};

// TEMPORARY MVP shortcut: there's no invite-based client onboarding yet, so
// a first-time sign-in gets auto-linked to whichever Client happens to
// exist first in the database — fine while there's exactly one demo
// client, wrong the moment there's a second one. Replace with a real
// invitation flow (matching the "Access is by invitation" copy on the
// sign-in page) before onboarding an actual second client.
export async function getCurrentUserContext(): Promise<CurrentUserContext> {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  let profile = await prisma.userProfile.findUnique({
    where: { id: session.user.id },
  });

  if (!profile) {
    const fallbackClient = await prisma.client.findFirst({
      orderBy: { createdAt: "asc" },
    });
    profile = await prisma.userProfile.create({
      data: {
        id: session.user.id,
        role: "CLIENT",
        clientId: fallbackClient?.id ?? null,
      },
    });
  }

  const project = profile.clientId
    ? await prisma.project.findFirst({
        where: { clientId: profile.clientId },
        orderBy: { createdAt: "asc" },
      })
    : null;

  return {
    userId: session.user.id,
    email: session.user.email,
    role: profile.role,
    project,
  };
}
