import { revalidateTag } from "next/cache";
import { TAG } from "@/lib/cache-tags";
import { isCronRequest } from "@/lib/cron-auth";
import { runRecon } from "@/lib/expenses/recon";

// The daily expenses recon (vercel.json): labels new Investec transactions,
// refreshes the monthly totals and emails a summary. See lib/expenses.
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
    // A failed run shows up in Vercel's cron log; tomorrow's catches up.
    return Response.json({ error: "Recon failed." }, { status: 500 });
  }
}
