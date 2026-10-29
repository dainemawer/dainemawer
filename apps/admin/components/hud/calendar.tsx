import { Bone } from "@/components/skeletons";
import { getAgenda } from "@/lib/calendar-feeds";
import { AgendaView } from "./agenda-view";

// The HUD's calendar: today and tomorrow from the work and personal feeds.
// Rendered on the server inside its own <Suspense> (it's data, so never in
// the static shell); AgendaView adds the live "now / next" in the browser.

export async function CalendarTile() {
  const agenda = await getAgenda();
  if (!agenda.sources.length) {
    return (
      <Frame>
        <p className="mt-1 text-sm">No calendars connected.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Set CALENDAR_WORK_URL and CALENDAR_PERSONAL_URL to each Google
          Calendar's secret address in iCal format.
        </p>
      </Frame>
    );
  }
  return (
    <Frame>
      <AgendaView
        today={agenda.today}
        events={agenda.events}
        sources={agenda.sources}
        failed={agenda.failed}
      />
    </Frame>
  );
}

export function CalendarSkeleton() {
  return (
    <Frame>
      <p className="mt-1 text-sm">
        <Bone w="22ch" />
      </p>
      <p className="mt-1 text-xs">
        <Bone w="14ch" />
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        {["30ch", "24ch", "28ch", "20ch"].map((w) => (
          <li key={w}>
            <Bone w={w} />
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-label="Calendar"
      className="border-t pt-3 md:col-span-2 xl:col-span-1"
    >
      <p className="text-xs text-muted-foreground">Calendar</p>
      {children}
    </section>
  );
}
