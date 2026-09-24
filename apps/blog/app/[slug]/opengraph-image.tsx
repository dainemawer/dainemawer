import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { LOGO_ASPECT_RATIO, logoDataUri } from "@/lib/logo-mark";
import { getAllPosts, getPostBySlug } from "@/lib/posts";

const LOGO_HEIGHT = 32;
const LOGO_WIDTH = Math.round(LOGO_HEIGHT * LOGO_ASPECT_RATIO);

export const alt = "Article preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function Image(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#ffffff",
        padding: "80px",
        fontFamily: "sans-serif",
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: next/image can't render inside Satori's ImageResponse (og image generation) */}
      <img
        src={logoDataUri("#111111")}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        alt=""
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 700,
            color: "#111111",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          {post.title}
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#6b6b6b" }}>
          {post.dek}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
