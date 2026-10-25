import type { Metadata } from "next";
import { Suspense } from "react";
import { GanttChart } from "@/components/gantt-chart";
import { PageHeader } from "@/components/page-header";
import { Loading, Skeleton } from "@/components/skeletons";
import { projects } from "@/lib/projects";
import { requireSession } from "@/lib/session";
import { getToday } from "@/lib/today";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="Projects"
        description="Mock data: a snapshot of Linear on 25 Oct 2026. Progress figures are illustrative."
      />
      <Suspense
        fallback={
          <Loading>
            <Skeleton className="h-72" />
          </Loading>
        }
      >
        <Projects />
      </Suspense>
    </>
  );
}

// Client names live in the mock, so it stays behind the session check
// like real data would (and "today" is request-time anyway).
async function Projects() {
  await requireSession();
  const today = await getToday();
  const scheduled = projects.flatMap((p) =>
    p.startDate ? [{ ...p, startDate: p.startDate }] : [],
  );
  const unscheduled = projects.filter((p) => !p.startDate);

  return (
    <>
      <section className="mb-12" aria-labelledby="timeline">
        <h2 id="timeline" className="mb-4 text-lg font-bold">
          Timeline
        </h2>
        <GanttChart projects={scheduled} today={today} />
      </section>

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
