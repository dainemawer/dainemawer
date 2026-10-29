import { revalidateTag } from "next/cache";
import { TAG } from "@/lib/cache-tags";
import { isCronRequest, reportCronFailure } from "@/lib/cron-auth";
import { runRecon } from "@/lib/expenses/recon";

// The daily expenses recon (vercel.json): labels new Investec transactions,
// refreshes the monthly totals and sends a summary to Telegram. See lib/expenses.
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const result = await runRecon();
    revalidateTag(TAG.expenses, { expire: 0 });
    return Response.json(result);
  } catch (error) {
    console.error("[expenses] recon failed", error);
    // Tomorrow's run catches up; Telegram says it happened.
    await reportCronFailure(
      "Expenses sync",
      error instanceof Error ? error.message : "Unknown error",
    );
    return Response.json({ error: "Recon failed." }, { status: 500 });
  }
}
