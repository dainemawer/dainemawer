"use server";

import { z } from "zod";
import { audit } from "@/lib/audit";
import { errorMessage } from "@/lib/errors";
import { mergePostPr } from "@/lib/github";
import { requireSession } from "@/lib/session";

const input = z.object({
  number: z.number().int().positive(),
  sha: z.string().regex(/^[0-9a-f]{40}$/),
});

/**
 * Approves a blog post: merges its pull request into main, pinned to the
 * commit the review page showed, and Vercel deploys it. Returns `{ error }`
 * instead of throwing, like every action the client reads.
 */
export async function approvePost(
  number: number,
  sha: string,
): Promise<{ error?: string; merged?: true }> {
  await requireSession();
  const parsed = input.safeParse({ number, sha });
  if (!parsed.success) return { error: "That isn't a pull request." };
  try {
    const pull = await mergePostPr(parsed.data.number, parsed.data.sha);
    await audit(
      "post-merged",
      `#${pull.number} ${pull.posts.map((p) => p.slug).join(", ")}`,
    );
    return { merged: true };
  } catch (error) {
    return { error: errorMessage(error, "Couldn't merge the pull request.") };
  }
}
