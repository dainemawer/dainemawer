import Link from "next/link";
import { Suspense } from "react";
import { AppNav } from "@/components/app-nav";
import { LogoMark } from "@/components/logo-mark";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { requireSession } from "@/lib/session";

// Static: the sidebar prerenders into every page's shell. Only the signed-in
// email streams in, and each page gates its own data (lib/queries.ts), so
// nothing here waits on the session. Collapsing is pure CSS off
// <html data-sidebar> (components/sidebar-toggle.tsx), so it stays static too.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto grid min-h-svh max-w-shell content-start md:grid-cols-shell md:sidebar-collapsed:grid-cols-[4.25rem_1fr] md:motion-safe:transition-[grid-template-columns]">
      <aside className="flex flex-col gap-8 border-b px-4 py-5 md:sticky md:top-0 md:h-svh md:overflow-x-hidden md:overflow-y-auto md:border-r md:border-b-0 md:px-6 md:py-8 md:sidebar-collapsed:items-center md:sidebar-collapsed:px-0">
        <div className="flex items-start justify-between gap-2 md:sidebar-collapsed:flex-col md:sidebar-collapsed:items-center md:sidebar-collapsed:gap-4">
          <Link
            href="/"
            aria-label="Dashboard"
            className="block text-ink transition-opacity hover:opacity-60"
          >
            <LogoMark className="h-4 w-auto md:sidebar-collapsed:hidden" />
            <LogoMark
              initial
              className="hidden h-6 w-auto md:sidebar-collapsed:block"
            />
            <span className="mt-1 block text-2xs font-medium tracking-wide text-muted-foreground uppercase md:sidebar-collapsed:hidden">
              Admin
            </span>
          </Link>
          <SidebarToggle className="-mt-1.5 -mr-2 hidden text-muted-foreground md:inline-flex md:sidebar-collapsed:m-0" />
        </div>
        {/* The active link needs the pathname, unknown for [id] routes
            while prerendering; the fallback is the same nav unhighlighted. */}
        <Suspense fallback={<AppNav />}>
          <AppNav highlight />
        </Suspense>
        <div className="mt-auto hidden text-xs text-muted-foreground md:block">
          <div className="md:sidebar-collapsed:hidden">
            <Suspense fallback={<p className="h-4" />}>
              <SignedInAs />
            </Suspense>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 md:px-10 md:py-8">{children}</main>
    </div>
  );
}

async function SignedInAs() {
  const { user } = await requireSession();
  return <p className="truncate">{user.email}</p>;
}
