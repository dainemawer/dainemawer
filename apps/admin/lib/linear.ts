import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { TAG } from "@/lib/cache-tags";
import { fraction, type Project, type ProjectStatus } from "@/lib/projects";

// Linear's GraphQL API, read-only: the projects and milestones behind the
// Projects page. Cached in the shared runtime cache for an hour; a Linear
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
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // A personal API key goes in as-is (no "Bearer").
      Authorization: process.env.LINEAR_API_KEY ?? "",
    },
    body: JSON.stringify({ query: QUERY, variables: { filter } }),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as {
    data?: { projects: { nodes: LinearProject[] } };
    errors?: { message: string }[];
  } | null;
  if (!response.ok || !body?.data) {
    throw new Error(
      `Linear: ${body?.errors?.[0]?.message ?? `HTTP ${response.status}`}`,
    );
  }
  return body.data.projects.nodes
    .filter((p) => p.status.type !== "canceled")
    .map(toProject);
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
