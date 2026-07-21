import { projects } from "@/lib/content/projects";
import { WorkRow } from "./WorkRow";

export function Work() {
  return (
    <section id="work" aria-labelledby="work-heading">
      <h2 id="work-heading" className="sr-only">
        Selected work
      </h2>
      {projects.map((project, index) => (
        <WorkRow
          key={project.slug}
          project={project}
          tone={index % 2 === 0 ? "surface-1" : "surface-2"}
        />
      ))}
    </section>
  );
}
