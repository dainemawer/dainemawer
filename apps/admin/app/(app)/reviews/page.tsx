import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Bone, Loading, times, widthFor } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { githubConfigured, listPostPulls, type PostPull } from "@/lib/github";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Post reviews" };

export default function ReviewsPage() {
  return (
    <>
      <PageHeader
        title="Post reviews"
        description="Blog posts waiting in a pull request. Read one, then approve it to merge and publish."
      />
      <Suspense
        fallback={
          <Loading>
            <ul className="divide-y border-y">
              {times(2, (i) => (
                <li key={i} className="py-4">
                  <p className="font-medium">
                    <Bone w={widthFor(i, 2)} />
                  </p>
                  <p className="mt-1 text-sm">
                    <Bone w={widthFor(i)} />
                  </p>
                </li>
              ))}
            </ul>
          </Loading>
        }
      >
        <Reviews />
      </Suspense>
    </>
  );
}

async function Reviews() {
  await requireSession();
  if (!githubConfigured()) {
    return (
      <EmptyState title="GitHub isn't connected">
        Add <code>GITHUB_TOKEN</code> (a fine-grained token for the blog's repo
        with Pull requests and Contents read and write) and redeploy.
      </EmptyState>
    );
  }
  // Outside the try: the prerender stops here, and that must reach Next.
  await connection();
  let pulls: PostPull[];
  try {
    pulls = await listPostPulls();
  } catch (error) {
    console.error("[reviews] GitHub fetch failed", error);
    return (
      <EmptyState title="Couldn't reach GitHub">
        Try again in a minute. If it keeps failing, check that{" "}
        <code>GITHUB_TOKEN</code> is still valid.
      </EmptyState>
    );
  }
  if (!pulls.length) {
    return <EmptyState title="No posts waiting for review" />;
  }
  return (
    <ul className="divide-y border-y">
      {pulls.map((pull) => (
        <li key={pull.number}>
          <Link
            href={`/reviews/${pull.number}`}
            className="block py-4 outline-none hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="flex flex-wrap items-center gap-2 font-medium">
              {pull.title}
              {pull.draft ? <Badge variant="outline">Draft</Badge> : null}
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              #{pull.number} ·{" "}
              {pull.posts
                .map((p) => (p.kind === "til" ? `TIL: ${p.slug}` : p.slug))
                .join(", ")}{" "}
              · opened{" "}
              {new Date(pull.createdAt).toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "short",
                timeZone: "Africa/Johannesburg",
              })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
