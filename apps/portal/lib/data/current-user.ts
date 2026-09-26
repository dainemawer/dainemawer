import { Prisma, prisma } from "db";
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
    // The dashboard layout and page both call this concurrently on a
    // first-ever sign-in. upsert() alone still isn't race-safe here —
    // Prisma's Postgres upsert is a SELECT-then-INSERT/UPDATE, not a
    // single atomic statement, so both calls can find no row and both
    // attempt the create; the loser hits a P2002 unique-constraint error
    // on id instead of falling back to the row the winner just inserted.
    // Catch that specific error and re-read the now-existing row.
    const fallbackClient = await prisma.client.findFirst({
      orderBy: { createdAt: "asc" },
    });
    try {
      profile = await prisma.userProfile.upsert({
        where: { id: session.user.id },
        create: {
          id: session.user.id,
          role: "CLIENT",
          clientId: fallbackClient?.id ?? null,
        },
        update: {},
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        profile = await prisma.userProfile.findUniqueOrThrow({
          where: { id: session.user.id },
        });
      } else {
        throw error;
      }
    }
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
