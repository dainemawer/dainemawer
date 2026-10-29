import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { TAG } from "@/lib/cache-tags";
import { type LinearIssue, linearToday } from "@/lib/linear-today";
import { fraction, type Project, type ProjectStatus } from "@/lib/projects";
import { requireSession } from "@/lib/session";
import { getToday } from "@/lib/today";

// Linear's GraphQL API, read-only: the projects and milestones behind the
// Projects page, and your issues for the dashboard HUD. Cached in the shared runtime cache for an hour; a Linear
// webhook (app/api/webhooks/linear) expires it the moment a project
// changes, so the hour is only the fallback when no webhook is set up.

const ENDPOINT = "https://api.linear.app/graphql";

const QUERY = `query Projects($filter: ProjectFilter) {
  projects(first: 100, filter: $filter) {
    nodes {
      id
      name
      url
      startDate
      targetDate
      progress
      status { type }
      projectMilestones(first: 50) { nodes { name progress sortOrder } }
    }
  }
}`;

type LinearProject = {
  id: string;
  name: string;
  url: string;
  startDate: string | null;
  targetDate: string | null;
  progress: number;
  status: { type: ProjectStatus | "canceled" };
  projectMilestones: {
    nodes: { name: string; progress: number; sortOrder: number }[];
  };
};

export function linearConfigured() {
  return Boolean(process.env.LINEAR_API_KEY);
}

/** Open projects, plus any completed in the last 60 days. Canceled ones never show. */
export async function fetchLinearProjects(): Promise<Project[]> {
  "use cache: remote";
  cacheTag(TAG.projects);
  cacheLife("hours");
  const team = process.env.LINEAR_TEAM_KEY?.trim();
  const filter = {
    status: { type: { nin: ["canceled"] } },
    or: [{ completedAt: { null: true } }, { completedAt: { gt: "-P60D" } }],
    ...(team ? { accessibleTeams: { some: { key: { eq: team } } } } : {}),
  };
  const data = await linearQuery<{ projects: { nodes: LinearProject[] } }>(
    QUERY,
    { filter },
  );
  return data.projects.nodes
    .filter((p) => p.status.type !== "canceled")
    .map(toProject);
}

const TODAY_QUERY = `query Today($filter: IssueFilter) {
  viewer {
    assignedIssues(first: 100, filter: $filter, orderBy: updatedAt) {
      nodes {
        identifier
        title
        url
        priority
        dueDate
        completedAt
        state { type }
        project { name }
      }
    }
  }
}`;

/** What needs you in Linear today, for the HUD, or null when Linear is down. */
export async function getLinearToday() {
  await requireSession();
  const today = await getToday();
  // Only the fetch is caught: the session check's own signals (a redirect,
  // or the prerender stopping at it) must reach Next.
  const issues = await fetchMyIssues(today).catch((error) => {
    console.error("[linear today]", error);
    return null;
  });
  return issues && linearToday(issues, today);
}

/**
 * Your issues that matter today (lib/linear-today.ts sorts them out): in
 * progress or to do, due by today, or finished since midnight. Backlog
 * only shows when it's due. A short cache, expired by the webhook when an
 * issue changes.
 */
async function fetchMyIssues(today: string): Promise<LinearIssue[]> {
  "use cache: remote";
  cacheTag(TAG.issues);
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  const team = process.env.LINEAR_TEAM_KEY?.trim();
  const filter = {
    or: [
      { state: { type: { in: ["started", "unstarted"] } } },
      {
        dueDate: { lte: today },
        state: { type: { nin: ["completed", "canceled"] } },
      },
      // Midnight in Cape Town (UTC+2 all year).
      { completedAt: { gte: `${today}T00:00:00+02:00` } },
    ],
    ...(team ? { team: { key: { eq: team } } } : {}),
  };
  const data = await linearQuery<{
    viewer: { assignedIssues: { nodes: LinearIssue[] } };
  }>(TODAY_QUERY, { filter });
  return data.viewer.assignedIssues.nodes;
}

async function linearQuery<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // A personal API key goes in as-is (no "Bearer").
      Authorization: process.env.LINEAR_API_KEY ?? "",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as {
    data?: T;
    errors?: { message: string }[];
  } | null;
  if (!response.ok || !body?.data) {
    throw new Error(
      `Linear: ${body?.errors?.[0]?.message ?? `HTTP ${response.status}`}`,
    );
  }
  return body.data;
}

function toProject(p: LinearProject): Project {
  return {
    id: p.id,
    name: p.name,
    status: p.status.type as ProjectStatus,
    startDate: p.startDate,
    targetDate: p.targetDate,
    progress: fraction(p.progress),
    milestones: [...p.projectMilestones.nodes]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => ({ name: m.name, progress: fraction(m.progress) })),
    url: p.url,
  };
}
