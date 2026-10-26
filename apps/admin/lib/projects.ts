// The Projects page's data: live from Linear (lib/linear.ts) when
// LINEAR_API_KEY is set. Without it (local dev), SAMPLE_PROJECTS stands in:
// the workspace as it stood on 2026-10-25, with illustrative progress.

export type ProjectStatus =
  | "backlog"
  | "planned"
  | "started"
  | "paused"
  | "completed";

export type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate: string | null;
  targetDate: string | null;
  /** 0–1, as Linear reports it. */
  progress: number;
  milestones: { name: string; progress: number }[];
  url: string;
};

/** Linear reports project progress as 0–1 and milestones as a "%"; accept either. */
export function fraction(value: number) {
  const v = value > 1 ? value / 100 : value;
  return Math.min(1, Math.max(0, v));
}

const linear = (slug: string) =>
  `https://linear.app/weareyield/project/${slug}`;

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: "P-YIELD-5",
    name: "Silver Lake Marine",
    status: "started",
    startDate: "2026-05-16",
    targetDate: null,
    progress: 0.9,
    milestones: [
      { name: "Project setup & infrastructure", progress: 1 },
      { name: "Schema & collections", progress: 1 },
      { name: "Business logic & reminders", progress: 1 },
      { name: "Dashboard & frontend", progress: 1 },
      { name: "Data migration", progress: 1 },
      { name: "QA, deploy & handover", progress: 0.43 },
    ],
    url: linear("silver-lake-marine-4cf0ef646895"),
  },
  {
    id: "P-YIELD-7",
    name: "Sterrekopje",
    status: "started",
    startDate: "2026-10-12",
    targetDate: "2026-10-30",
    progress: 0.6,
    milestones: [],
    url: linear("sterrekopje-510bc5f0f73b"),
  },
  {
    id: "P-YIELD-6",
    name: "The Blank Brand",
    status: "started",
    startDate: "2026-10-12",
    targetDate: "2026-10-30",
    progress: 0.45,
    milestones: [],
    url: linear("the-blank-brand-bd93465bcca8"),
  },
  {
    id: "P-YIELD-8",
    name: "Blank Canvas Capital",
    status: "started",
    startDate: "2026-10-12",
    targetDate: null,
    progress: 0.3,
    milestones: [],
    url: linear("blank-canvas-capital-02e8355741af"),
  },
  {
    id: "P-YIELD-9",
    name: "Work Goals",
    status: "started",
    startDate: "2026-10-12",
    targetDate: null,
    progress: 0.2,
    milestones: [],
    url: linear("work-goals-1e3891851471"),
  },
  {
    id: "P-YIELD-10",
    name: "VesselPass",
    status: "backlog",
    startDate: null,
    targetDate: null,
    progress: 0,
    milestones: [],
    url: linear("vesselpass-aad5e29e3919"),
  },
];
