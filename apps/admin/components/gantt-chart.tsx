import { addDays, formatDate } from "@/lib/documents";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

// One row per scheduled project: a light track from start to target date,
// filled in ink to the project's progress. A project without a target date
// runs to today on a track that fades out, so the open end reads as unknown
// rather than finished. HTML rather than SVG so the labels stay legible at phone
// width. Only the drawn timeline is hidden from screen readers: the project
// links and progress beside it stay reachable, and the sr-only table gives
// the dates.

type Scheduled = Project & { startDate: string };

const DAY = 864e5;
const days = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / DAY;

export function GanttChart({
  projects,
  today,
}: {
  projects: Scheduled[];
  today: string;
}) {
  const first = projects.reduce(
    (min, p) => (p.startDate < min ? p.startDate : min),
    today,
  );
  const last = projects.reduce(
    (max, p) => (p.targetDate && p.targetDate > max ? p.targetDate : max),
    addDays(today, 14),
  );
  const from = `${first.slice(0, 7)}-01`;
  const to = endOfMonth(last);
  const span = days(to) - days(from) + 1;
  const pct = (iso: string) => ((days(iso) - days(from)) / span) * 100;
  const months = monthStarts(from, to);
  const todayAt = pct(today);

  return (
    <figure>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <Legend className="bg-ink" label="Done" />
        <Legend className="bg-[#e4e4e4]" label="Remaining" />
        <Legend
          className="bg-linear-to-r from-[#e4e4e4] to-transparent"
          label="No target date"
        />
      </div>

      <div>
        <Row label={null}>
          {months.map((m) => (
            <span
              key={m}
              className="absolute top-0 -translate-x-px pl-1.5 text-2xs text-muted-foreground"
              style={{ left: `${pct(m)}%` }}
            >
              {monthLabel(m)}
            </span>
          ))}
        </Row>

        {projects.map((p) => {
          const open = !p.targetDate;
          const end = p.targetDate ?? today;
          const left = pct(p.startDate);
          const width = Math.max(pct(addDays(end, 1)) - left, 0.75);
          const late = !open && end < today && p.progress < 1;
          const done = p.milestones.filter((m) => m.progress >= 1).length;
          return (
            <Row
              key={p.id}
              label={
                <>
                  <a
                    href={p.url}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {p.name}
                  </a>
                  <span
                    className={cn(
                      "block text-2xs",
                      late ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {Math.round(p.progress * 100)}%
                    {p.milestones.length
                      ? ` · ${done} of ${p.milestones.length} milestones`
                      : null}
                    {late ? " · past target" : null}
                  </span>
                </>
              }
            >
              {months.map((m) => (
                <span
                  key={m}
                  className="absolute inset-y-0 w-px bg-border"
                  style={{ left: `${pct(m)}%` }}
                />
              ))}
              <span
                className="absolute inset-y-0 w-px bg-ink"
                style={{ left: `${todayAt}%` }}
              />
              <span
                title={`${p.name}: ${formatDate(p.startDate)} – ${open ? "no target date" : formatDate(end)}, ${Math.round(p.progress * 100)}% done`}
                className={cn(
                  "absolute top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded",
                  open
                    ? "bg-linear-to-r from-[#e4e4e4] from-60% to-transparent"
                    : late
                      ? "bg-destructive/15"
                      : "bg-[#e4e4e4]",
                )}
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                <span
                  className={cn(
                    "block h-full",
                    late ? "bg-destructive" : "bg-ink",
                  )}
                  style={{ width: `${p.progress * 100}%` }}
                />
              </span>
            </Row>
          );
        })}

        <Row label={null}>
          <span
            className="absolute top-0.5 -translate-x-1/2 text-2xs font-medium"
            style={{ left: `${todayAt}%` }}
          >
            Today
          </span>
        </Row>
      </div>

      <table className="sr-only">
        <caption>Project timeline</caption>
        <thead>
          <tr>
            <th>Project</th>
            <th>Start</th>
            <th>Target</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{formatDate(p.startDate)}</td>
              <td>{p.targetDate ? formatDate(p.targetDate) : "None"}</td>
              <td>{Math.round(p.progress * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function Row({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-x-4 md:grid-cols-[11rem_1fr]">
      <div
        className={cn("min-w-0 pt-3 md:pt-2", label ? "" : "hidden md:block")}
      >
        {label}
      </div>
      <div
        aria-hidden="true"
        className={cn("relative", label ? "h-7 md:h-12" : "h-5")}
      >
        {children}
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn("inline-block h-2.5 w-4 rounded-sm", className)}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

function endOfMonth(iso: string) {
  const d = new Date(`${iso.slice(0, 7)}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
}

function monthStarts(from: string, to: string) {
  const out: string[] = [];
  const d = new Date(`${from}T00:00:00Z`);
  while (d.toISOString().slice(0, 10) <= to) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

function monthLabel(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}
