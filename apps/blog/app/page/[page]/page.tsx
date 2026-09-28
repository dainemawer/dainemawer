import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeIndex } from "@/components/home-index";
import {
  laterPages,
  pagePath,
  paginate,
  parsePageParam,
} from "@/lib/pagination";
import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";

// Pages 2…N of the homepage index. Page 1 is `/` (next.config.ts redirects
// /page/1 there), and anything past the last page is a real 404 rather
// than an empty list.
export const dynamicParams = false;

export function generateStaticParams() {
  return laterPages(getAllPosts().length).map((page) => ({
    page: String(page),
  }));
}

function sliceFor(param: string) {
  const page = parsePageParam(param);
  return page && page > 1 ? paginate(getAllPosts(), page) : undefined;
}

// Each page is canonical to itself — pointing page 2 at `/` would tell
// crawlers to drop it, and with it the only links to older articles.
export async function generateMetadata(
  props: PageProps<"/page/[page]">,
): Promise<Metadata> {
  const { page: param } = await props.params;
  const slice = sliceFor(param);
  if (!slice) return {};
  const { page, totalPages } = slice;
  const path = pagePath("/", page);
  return {
    title: `Writing — page ${page} of ${totalPages}`,
    description: `Page ${page} of ${totalPages}. ${site.description}`,
    alternates: {
      canonical: path,
      types: {
        "application/rss+xml": `${site.url}/rss.xml`,
        "text/markdown": `${site.url}${path}.md`,
      },
    },
    pagination: {
      previous: pagePath("/", page - 1),
      next: page < totalPages ? pagePath("/", page + 1) : undefined,
    },
  };
}

export default async function HomePageN(props: PageProps<"/page/[page]">) {
  const { page: param } = await props.params;
  const slice = sliceFor(param);
  if (!slice) notFound();
  return <HomeIndex slice={slice} />;
}
