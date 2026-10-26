import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { GanttChart, GanttChartSkeleton } from "@/components/gantt-chart";
import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/skeletons";
import { fetchLinearProjects, linearConfigured } from "@/lib/linear";
import { type Project, SAMPLE_PROJECTS } from "@/lib/projects";
import { requireSession } from "@/lib/session";
import { getToday } from "@/lib/today";

export const metadata: Metadata = { title: "Projects" };

// Without LINEAR_API_KEY, local dev shows sample data so the page can be
// worked on; production says Linear isn't connected instead.
const showSample = () =>
  !linearConfigured() && process.env.NODE_ENV !== "production";

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="Projects"
        description={
          showSample()
            ? "Sample data: set LINEAR_API_KEY to load your Linear projects."
            : "Live from Linear: open projects, and any completed in the last 60 days."
        }
      />
      <Suspense
        fallback={
          <Loading>
            <section className="mb-12">
              <h2 className="mb-4 text-lg font-bold">Timeline</h2>
              <GanttChartSkeleton rows={5} />
            </section>
          </Loading>
        }
      >
        <Projects />
      </Suspense>
    </>
  );
}

// Client names are in here, so it stays behind the session check like
// every other read.
async function Projects() {
  await requireSession();
  if (!linearConfigured() && !showSample()) {
    return (
      <EmptyState title="Linear isn't connected">
        Add <code>LINEAR_API_KEY</code> (Linear → Settings → Security & access →
        Personal API keys, read-only) to the environment and redeploy.
      </EmptyState>
    );
  }
  let projects: Project[];
  try {
    projects = showSample() ? SAMPLE_PROJECTS : await fetchLinearProjects();
  } catch (error) {
    console.error("[projects] Linear fetch failed", error);
    return (
      <EmptyState title="Couldn't reach Linear">
        Try again in a minute. If it keeps failing, check that{" "}
        <code>LINEAR_API_KEY</code> is still valid.
      </EmptyState>
    );
  }
  const today = await getToday();
  const scheduled = projects.flatMap((p) =>
    p.startDate ? [{ ...p, startDate: p.startDate }] : [],
  );
  const unscheduled = projects.filter((p) => !p.startDate);

  if (!projects.length) {
    return <EmptyState title="No open projects in Linear" />;
  }

  return (
    <>
      {scheduled.length ? (
        <section className="mb-12" aria-labelledby="timeline">
          <h2 id="timeline" className="mb-4 text-lg font-bold">
            Timeline
          </h2>
          <GanttChart projects={scheduled} today={today} />
        </section>
      ) : null}

      {unscheduled.length ? (
        <section aria-labelledby="unscheduled">
          <h2 id="unscheduled" className="mb-3 text-lg font-bold">
            Not scheduled
          </h2>
          <ul className="divide-y border-y">
            {unscheduled.map((p) => (
              <li key={p.id} className="flex justify-between gap-4 py-3">
                <a href={p.url} className="text-sm font-medium hover:underline">
                  {p.name}
                </a>
                <span className="text-sm text-muted-foreground capitalize">
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
