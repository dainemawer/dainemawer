"use client";

import { useEffect } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { Logo } from "@/components/logo";
import { PageShell } from "@/components/page-shell";

export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell sidebar={<Logo />}>
      <div className="mx-auto max-w-content">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Error" }]}
        />
        <h1 className="mt-4.5 text-2xl text-ink tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-md text-muted text-pretty">
          That's on us, not you. Give it another try, or head back home.
        </p>
        <div className="mt-8 flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => retry()}
            className="text-ink transition-opacity duration-140 ease-out hover:opacity-60 focus-visible:opacity-60"
          >
            Try again
          </button>
          <span className="text-divider">/</span>
          <a
            href="/"
            className="text-muted transition-opacity duration-140 ease-out hover:opacity-100 focus-visible:opacity-100"
          >
            Back home
          </a>
        </div>
      </div>
    </PageShell>
  );
}
