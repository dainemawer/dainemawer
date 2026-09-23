import { generateLlmsTxt } from "@/lib/llms";
import { getPostContent } from "@/lib/mdx";
import { getAllPosts } from "@/lib/posts";

function generateLlmsFullTxt(): string {
  const parts = [generateLlmsTxt(), "", "## Full article text", ""];

  for (const post of getAllPosts()) {
    const content = getPostContent(post.slug);
    if (!content) continue;

    parts.push(
      `### ${post.title}`,
      "",
      content.shortAnswer,
      "",
      content.rawBody,
      "",
    );
  }

  return parts.join("\n");
}

export function GET() {
  return new Response(generateLlmsFullTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
