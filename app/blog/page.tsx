import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Writing on shipping AI-powered products, coming soon.",
};

export default function BlogPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-12">
      <p className="font-mono text-sm uppercase tracking-widest text-muted-3">
        Blog — coming soon
      </p>
    </main>
  );
}
