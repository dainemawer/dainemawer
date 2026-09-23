import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { Logo } from "@/components/logo";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Not Found",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <PageShell sidebar={<Logo />}>
      <div className="mx-auto max-w-content">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Not found" }]}
        />
        <h1 className="mt-4.5 text-2xl text-ink tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-md text-muted text-pretty">
          Whatever you were looking for isn't here — it may have moved, or the
          link's out of date.
        </p>
        <div className="mt-8 flex items-center gap-4 text-sm">
          <Link
            href="/"
            className="text-ink transition-opacity duration-140 ease-out hover:opacity-60 focus-visible:opacity-60"
          >
            Back home
          </Link>
          <span className="text-divider">/</span>
          <Link
            href="/about"
            className="text-muted transition-opacity duration-140 ease-out hover:opacity-100 focus-visible:opacity-100"
          >
            About
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
