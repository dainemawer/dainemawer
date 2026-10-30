import { isCronRequest, reportCronFailure } from "@/lib/cron-auth";
import { PLAN } from "@/lib/health";
import { cravingsThisWeek, currentHealth } from "@/lib/health-log";
import { HEALTH_HELP, weeklyReview } from "@/lib/health-messages";
import { appUrl, sendTelegram } from "@/lib/telegram";

// The health plan's scheduled messages (vercel.json, times in UTC):
// ?slot=morning at 07:00 Cape Town asks for a weigh-in, unless there is
// one; ?slot=evening at 19:45 says the kitchen closes soon; ?slot=weekly on
// Sunday at 18:00 sends the week's review.

const SLOTS = ["morning", "evening", "weekly"] as const;

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const slot = new URL(request.url).searchParams.get("slot");
  if (!SLOTS.includes(slot as (typeof SLOTS)[number])) {
    return Response.json({ error: "Unknown slot." }, { status: 400 });
  }
  try {
    const health = await currentHealth();
    if (slot === "morning") {
      if (health.today.weightGrams !== null) {
        return Response.json({ sent: false });
      }
      await sendTelegram({
        title: "Morning. Weigh in?",
        lines: [
          "After the bathroom, before breakfast. Send me the number, like 87.4.",
        ],
      });
    } else if (slot === "evening") {
      await sendTelegram(
        {
          title: `Kitchen closes at ${PLAN.kitchenCloses}`,
          lines: [
            "Anything else for today, have it now. If a craving shows up later, send me: craving.",
            HEALTH_HELP,
          ],
        },
        { quiet: true },
      );
    } else {
      await sendTelegram(
        {
          ...weeklyReview(health, await cravingsThisWeek()),
          url: appUrl("/health"),
        },
        { quiet: true },
      );
    }
    return Response.json({ sent: true });
  } catch (error) {
    console.error("[health] cron failed", error);
    await reportCronFailure(
      `Health (${slot})`,
      error instanceof Error ? error.message : "Unknown error",
    );
    return Response.json({ error: "Failed." }, { status: 500 });
  }
}
