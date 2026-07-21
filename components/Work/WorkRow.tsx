import Link from "next/link";
import type { Project } from "@/lib/content/projects";
import { TagPill } from "./TagPill";

interface WorkRowProps {
  project: Project;
  tone: "surface-1" | "surface-2";
}

export function WorkRow({ project, tone }: WorkRowProps) {
  const shortYear = `'${String(project.year).slice(-2)}`;

  return (
    <div className={tone === "surface-1" ? "bg-surface-1" : "bg-surface-2"}>
      <Link
        href={`/work/${project.slug}`}
        className="group mx-auto flex max-w-[1408px] items-center gap-8 px-6 py-12 md:gap-16 md:px-16 md:py-16"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="truncate text-2xl font-semibold text-white transition-opacity duration-300 ease-out group-hover:opacity-40 md:text-3xl">
              {project.title}
            </h3>
            <span className="shrink-0 font-mono text-xl text-muted-3 md:text-2xl">
              {shortYear}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {project.tags.map((tag) => (
              <TagPill key={tag}>{tag}</TagPill>
            ))}
            <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="hidden aspect-[4/3] w-[180px] shrink-0 bg-surface-3 ring-1 ring-border-1 transition-transform duration-300 ease-out group-hover:scale-105 sm:block"
        />
        <span className="sr-only"> — View project</span>
      </Link>
    </div>
  );
}
