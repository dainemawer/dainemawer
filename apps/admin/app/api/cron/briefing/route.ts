import { sendBriefing } from "@/lib/briefing";
import { isCronRequest, reportCronFailure } from "@/lib/cron-auth";

// The morning briefing (vercel.json: 05:00 UTC = 07:00 Cape Town), after
// the 06:00 jobs have queued their notes. See lib/briefing.ts.

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    return Response.json(await sendBriefing());
  } catch (error) {
    console.error("[briefing] failed", error);
    await reportCronFailure(
      "Morning briefing",
      error instanceof Error ? error.message : "Unknown error",
    );
    return Response.json({ error: "Briefing failed." }, { status: 500 });
  }
}
