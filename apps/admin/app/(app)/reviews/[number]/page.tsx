import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ApprovePostButton } from "@/components/approve-post-button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PostMdx } from "@/components/post-mdx";
import { Bone, Loading, Skeleton, times } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fileAt,
  getPostPull,
  githubConfigured,
  type PostPullDetail,
} from "@/lib/github";
import {
  type CheckState,
  liveUrl,
  type PostFile,
  parsePost,
} from "@/lib/post-review";
import { requireSession } from "@/lib/session";

const REVIEWS = [{ label: "Post reviews", href: "/reviews" }];

export async function generateMetadata({
  params,
}: PageProps<"/reviews/[number]">) {
  return { title: `Review #${(await params).number}` };
}

export default function ReviewPage({ params }: PageProps<"/reviews/[number]">) {
  return (
    <Suspense
      fallback={
        <Loading>
          <PageHeader
            breadcrumbs={REVIEWS}
            current={<Bone w="6ch" />}
            title={<Bone w="30ch" />}
            description={<Bone w="20ch" />}
            actions={times(2, (i) => <Skeleton key={i} className="h-9 w-28" />)}
          />
          <div className="flex max-w-[68ch] flex-col gap-3">
            {times(8, (i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </Loading>
      }
    >
      <Review params={params} />
    </Suspense>
  );
}

async function Review({
  params,
}: Pick<PageProps<"/reviews/[number]">, "params">) {
  await requireSession();
  const number = Number((await params).number);
  if (!Number.isInteger(number) || number <= 0) notFound();
  if (!githubConfigured()) {
    return (
      <EmptyState title="GitHub isn't connected">
        Add <code>GITHUB_TOKEN</code> and redeploy.
      </EmptyState>
    );
  }
  // Outside the try: the prerender stops here, and that must reach Next.
  await connection();
  let pull: PostPullDetail | null;
  let sources: string[];
  try {
    pull = await getPostPull(number);
    const sha = pull?.headSha ?? "";
    // The paths come from the PR's own file list, filtered to posts.
    sources = await Promise.all(
      (pull?.posts ?? []).map((p) => fileAt(p.path, sha)),
    );
  } catch (error) {
    console.error(`[reviews] GitHub fetch for #${number} failed`, error);
    return (
      <EmptyState title="Couldn't reach GitHub">
        Try again in a minute.
      </EmptyState>
    );
  }
  if (!pull) notFound();
  const posts = pull.posts.map((file, i) => ({
    file,
    post: parsePost(sources[i], file.slug),
  }));
  const blocked = pull.draft || pull.mergeable === false;

  return (
    <>
      <PageHeader
        breadcrumbs={REVIEWS}
        current={`#${pull.number}`}
        title={pull.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ChecksBadge state={pull.checks} />
            {pull.draft ? <Badge variant="outline">Draft</Badge> : null}
            {pull.mergeable === false ? (
              <Badge variant="destructive">Merge conflict</Badge>
            ) : null}
            <span>
              {pull.branch} · {pull.headSha.slice(0, 7)}
            </span>
          </span>
        }
        actions={
          <>
            {pull.previewUrl ? (
              <Button asChild variant="outline">
                <a
                  href={`${pull.previewUrl}/${posts[0].file.kind === "til" ? "til/" : ""}${posts[0].file.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Vercel preview
                </a>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <a href={pull.url} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </Button>
            <ApprovePostButton
              number={pull.number}
              sha={pull.headSha}
              title={posts[0].post.frontmatter.title}
              disabled={blocked}
            />
          </>
        }
      />

      {pull.body ? (
        <details className="mb-10 rounded-md border px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium">
            Pull request notes
          </summary>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-muted-foreground">
            {pull.body}
          </pre>
        </details>
      ) : null}

      {posts.map(({ file, post }) => (
        <Article key={file.path} file={file} post={post} />
      ))}
    </>
  );
}

function ChecksBadge({ state }: { state: CheckState }) {
  if (state === "none") return null;
  const label = {
    passing: "Checks passing",
    pending: "Checks running",
    failing: "Checks failing",
  }[state];
  return (
    <Badge variant={state === "failing" ? "destructive" : "secondary"}>
      {label}
    </Badge>
  );
}

function Article({
  file,
  post,
}: {
  file: PostFile;
  post: ReturnType<typeof parsePost>;
}) {
  const { frontmatter: fm } = post;
  return (
    <article className="mb-16 border-t pt-10 first-of-type:border-t-0 first-of-type:pt-0">
      <p className="mb-2 text-xs text-muted-foreground">
        {file.kind === "til" ? "TIL" : "Post"} · {liveUrl(file)}
      </p>
      <h2 className="max-w-[30ch] text-3xl tracking-tight text-balance text-ink">
        {fm.title}
      </h2>
      {fm.dek ? (
        <p className="mt-2 max-w-[68ch] text-md text-muted-foreground text-pretty">
          {fm.dek}
        </p>
      ) : null}
      <p className="mt-4 flex flex-wrap gap-x-2 text-sm text-muted-foreground">
        <span>{fm.date ?? "No date"}</span>
        <span aria-hidden="true">|</span>
        <span>{post.readMinutes} min read</span>
        <span aria-hidden="true">|</span>
        <span>{post.wordCount.toLocaleString("en-ZA")} words</span>
        {fm.topics.length ? (
          <>
            <span aria-hidden="true">|</span>
            <span>{fm.topics.join(", ")}</span>
          </>
        ) : null}
      </p>

      {fm.shortAnswer ? (
        <Section label="The short answer">
          <p className="max-w-[68ch] text-md italic leading-relaxed text-pretty">
            {fm.shortAnswer}
          </p>
        </Section>
      ) : null}

      <div className="mt-12">
        <PostMdx source={post.body} />
      </div>

      {fm.takeaways.length ? (
        <Section label="Takeaways">
          <ol className="flex max-w-[68ch] list-decimal flex-col gap-3 pl-5.5 text-pretty">
            {fm.takeaways.map((t) => (
              <li key={t.slice(0, 40)}>{t}</li>
            ))}
          </ol>
        </Section>
      ) : null}

      {fm.faq.length ? (
        <Section label="Questions">
          <dl className="flex max-w-[68ch] flex-col gap-4">
            {fm.faq.map((item) => (
              <div key={item.question}>
                <dt className="font-medium">{item.question}</dt>
                <dd className="mt-1 text-muted-foreground text-pretty">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}
    </article>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h3 className="mb-3 text-2xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </h3>
      {children}
    </section>
  );
}
