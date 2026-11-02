import "server-only";
import { connection } from "next/server";
import { UserError } from "@/lib/errors";
import {
  type CheckState,
  checkState,
  type PostFile,
  postFiles,
} from "@/lib/post-review";

// GitHub's REST API for the blog post review (/reviews): open pull requests
// that add or change a post, the post's MDX at the PR's head commit, and the
// merge. Needs GITHUB_TOKEN, a fine-grained token for the blog's repo only
// with Pull requests and Contents read and write (merging writes to main).
// Never cached: a review must show what's on the branch now, and the merge
// is pinned to the commit that was shown (see mergePostPr).

const API = "https://api.github.com";

/** owner/name of the repo the blog lives in. */
export const repo = () => process.env.GITHUB_REPO ?? "dainemawer/dainemawer";

/** The GitHub deployment environment Vercel uses for the blog's previews. */
const PREVIEW_ENVIRONMENT = "Preview – dainemawer";

export function githubConfigured() {
  return Boolean(process.env.GITHUB_TOKEN);
}

async function github(path: string, init: RequestInit = {}) {
  // Live data: never part of a prerender.
  await connection();
  if (!githubConfigured()) throw new UserError("GitHub isn't connected.");
  const response = await fetch(`${API}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
    },
  });
  return response;
}

async function githubJson<T>(path: string): Promise<T> {
  const response = await github(path);
  if (!response.ok) {
    throw new Error(`GitHub ${path}: ${response.status}`);
  }
  return (await response.json()) as T;
}

type ApiPull = {
  number: number;
  title: string;
  html_url: string;
  body: string | null;
  draft: boolean;
  created_at: string;
  user: { login: string } | null;
  head: { sha: string; ref: string; repo: { full_name: string } | null };
  base: { ref: string };
  mergeable?: boolean | null;
  mergeable_state?: string;
};

export type PostPull = {
  number: number;
  title: string;
  url: string;
  draft: boolean;
  createdAt: string;
  author: string | null;
  branch: string;
  base: string;
  headSha: string;
  posts: PostFile[];
};

// Only branches in the blog's own repo count. A fork's PR is someone else's
// code, and its MDX is compiled on this server, so it never shows here.
const sameRepo = (pull: ApiPull) => pull.head.repo?.full_name === repo();

function toPostPull(pull: ApiPull, posts: PostFile[]): PostPull {
  return {
    number: pull.number,
    title: pull.title,
    url: pull.html_url,
    draft: pull.draft,
    createdAt: pull.created_at,
    author: pull.user?.login ?? null,
    branch: pull.head.ref,
    base: pull.base.ref,
    headSha: pull.head.sha,
    posts,
  };
}

async function pullPosts(number: number) {
  const files = await githubJson<{ filename: string; status: string }[]>(
    `/repos/${repo()}/pulls/${number}/files?per_page=100`,
  );
  return postFiles(files);
}

/** Open pull requests into the blog that add or change a post, newest first. */
export async function listPostPulls(): Promise<PostPull[]> {
  const pulls = await githubJson<ApiPull[]>(
    `/repos/${repo()}/pulls?state=open&sort=created&direction=desc&per_page=50`,
  );
  const withPosts = await Promise.all(
    pulls.filter(sameRepo).map(async (pull) => {
      const posts = await pullPosts(pull.number);
      return posts.length ? toPostPull(pull, posts) : null;
    }),
  );
  return withPosts.filter((pull) => pull !== null);
}

export type PostPullDetail = PostPull & {
  body: string | null;
  /** null while GitHub is still working it out. */
  mergeable: boolean | null;
  mergeableState: string | null;
  checks: CheckState;
  previewUrl: string | null;
};

/** One open post PR with its checks and preview, or null if it isn't one. */
export async function getPostPull(
  number: number,
): Promise<PostPullDetail | null> {
  const response = await github(`/repos/${repo()}/pulls/${number}`);
  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error(`GitHub pull ${number}: ${response.status}`);
  const pull = (await response.json()) as ApiPull & { state: string };
  if (pull.state !== "open" || !sameRepo(pull)) return null;
  const sha = pull.head.sha;
  const [posts, runs, status, previewUrl] = await Promise.all([
    pullPosts(number),
    githubJson<{
      check_runs: { status: string; conclusion: string | null }[];
    }>(`/repos/${repo()}/commits/${sha}/check-runs?per_page=100`),
    githubJson<{ statuses: { state: string }[] }>(
      `/repos/${repo()}/commits/${sha}/status`,
    ),
    previewFor(sha),
  ]);
  if (!posts.length) return null;
  return {
    ...toPostPull(pull, posts),
    body: pull.body,
    mergeable: pull.mergeable ?? null,
    mergeableState: pull.mergeable_state ?? null,
    checks: checkState(runs.check_runs, status.statuses),
    previewUrl,
  };
}

/** The blog's Vercel preview for a commit, if one has deployed. */
async function previewFor(sha: string): Promise<string | null> {
  try {
    const deployments = await githubJson<{ id: number }[]>(
      `/repos/${repo()}/deployments?sha=${sha}&environment=${encodeURIComponent(PREVIEW_ENVIRONMENT)}&per_page=1`,
    );
    if (!deployments[0]) return null;
    const statuses = await githubJson<
      { state: string; environment_url?: string }[]
    >(`/repos/${repo()}/deployments/${deployments[0].id}/statuses?per_page=1`);
    const latest = statuses[0];
    return latest?.state === "success" && latest.environment_url
      ? latest.environment_url
      : null;
  } catch (error) {
    console.error("[github] preview lookup failed", error);
    return null;
  }
}

/** A file's text at a commit. The path must come from the PR's own file list. */
export async function fileAt(path: string, sha: string): Promise<string> {
  const response = await github(
    `/repos/${repo()}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${sha}`,
    { headers: { Accept: "application/vnd.github.raw" } },
  );
  if (!response.ok)
    throw new Error(`GitHub ${path}@${sha}: ${response.status}`);
  return response.text();
}

/**
 * Merges a post PR, but only if its head is still `sha`, the commit the
 * review page showed: anything pushed after you read it makes GitHub refuse
 * (409), so you never approve words you haven't seen. Uses a merge commit,
 * like every other PR here, then deletes the branch (the repo doesn't).
 */
export async function mergePostPr(number: number, sha: string) {
  const pull = await getPostPull(number);
  if (!pull) throw new UserError("That pull request isn't an open post.");
  if (pull.headSha !== sha) {
    throw new UserError(
      "The branch has new commits since this page loaded. Reload and read it again.",
    );
  }
  const response = await github(`/repos/${repo()}/pulls/${number}/merge`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sha, merge_method: "merge" }),
  });
  if (!response.ok) {
    const { message } = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    if (response.status === 409) {
      throw new UserError(
        "The branch changed since this page loaded. Reload and read it again.",
      );
    }
    if (response.status === 405 || response.status === 422) {
      throw new UserError(
        `GitHub won't merge it yet${message ? `: ${message}` : "."}`,
      );
    }
    throw new Error(`GitHub merge ${number}: ${response.status} ${message}`);
  }
  // The branch is merged, so losing it costs nothing; a failure is only logged.
  const deleted = await github(
    `/repos/${repo()}/git/refs/heads/${pull.branch.split("/").map(encodeURIComponent).join("/")}`,
    { method: "DELETE" },
  ).catch(() => null);
  if (!deleted?.ok) {
    console.error(`[github] couldn't delete branch ${pull.branch}`);
  }
  return pull;
}

const TIL_DIR = "apps/blog/content/til";

/** The newest TIL files on main (by their `date`), as examples of the voice. */
export async function recentTils(count = 3): Promise<string[]> {
  const listing = await githubJson<{ name: string; path: string }[]>(
    `/repos/${repo()}/contents/${TIL_DIR}?ref=main`,
  );
  const files = await Promise.all(
    listing
      .filter((f) => f.name.endsWith(".mdx"))
      .map((f) => fileAt(f.path, "main").catch(() => null)),
  );
  const dated = files
    .filter((text): text is string => text !== null)
    .map((text) => ({
      text,
      date: /^date:\s*'?(\d{4}-\d{2}-\d{2})/m.exec(text)?.[1] ?? "",
    }));
  return dated
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, count)
    .map((d) => d.text);
}

async function exists(path: string) {
  const response = await github(path, { method: "HEAD" });
  return response.ok;
}

async function githubWrite<T>(path: string, method: string, body: unknown) {
  const response = await github(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const { message } = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(`GitHub ${method} ${path}: ${response.status} ${message}`);
  }
  return (await response.json()) as T;
}

/**
 * Opens a pull request that adds one TIL: a new `til/<slug>` branch from
 * main, the file, and the PR. Only ever adds a file under content/til, and
 * never merges: approving it is /reviews' job. A slug already used on main
 * or by a branch gets -2, -3…
 */
export async function openTilPr({
  slug,
  file,
  title,
  body,
}: {
  slug: string;
  /** Builds the file for the slug finally used. */
  file: (slug: string) => string;
  title: string;
  body: string;
}): Promise<{ number: number; url: string; slug: string }> {
  const { object: main } = await githubJson<{ object: { sha: string } }>(
    `/repos/${repo()}/git/ref/heads/main`,
  );
  let final = slug;
  for (let n = 2; n < 50; n++) {
    const taken = await Promise.all([
      exists(`/repos/${repo()}/contents/${TIL_DIR}/${final}.mdx?ref=main`),
      exists(`/repos/${repo()}/git/ref/heads/til/${final}`),
    ]);
    if (!taken.some(Boolean)) break;
    final = `${slug}-${n}`;
  }
  const branch = `til/${final}`;
  await githubWrite(`/repos/${repo()}/git/refs`, "POST", {
    ref: `refs/heads/${branch}`,
    sha: main.sha,
  });
  await githubWrite(
    `/repos/${repo()}/contents/${TIL_DIR}/${final}.mdx`,
    "PUT",
    {
      message: `docs: add til ${final}`,
      content: Buffer.from(file(final)).toString("base64"),
      branch,
    },
  );
  const pull = await githubWrite<{ number: number; html_url: string }>(
    `/repos/${repo()}/pulls`,
    "POST",
    { title, head: branch, base: "main", body },
  );
  return { number: pull.number, url: pull.html_url, slug: final };
}
