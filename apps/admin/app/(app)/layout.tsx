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
// Collapsed, the shell drops its max width so the icon rail sits on the
// screen's left edge, and the content takes the shell's width instead.
// A page holding [data-wide] (the dashboard) drops both caps and fills the
// screen either way.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* First stop for keyboard users: past the sidebar's dozen links. */}
      <a
        href="#main"
        className="sr-only rounded-md bg-ink text-sm font-medium text-surface focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <div className="mx-auto grid min-h-svh max-w-shell content-start md:grid-cols-shell md:sidebar-collapsed:max-w-none md:sidebar-collapsed:grid-cols-[4.25rem_1fr] md:has-[[data-wide]]:max-w-none">
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
        <main
          id="main"
          tabIndex={-1}
          className="min-w-0 focus:outline-none px-4 py-6 md:px-10 md:py-8 md:sidebar-collapsed:mx-auto md:sidebar-collapsed:w-full md:sidebar-collapsed:max-w-shell md:has-[[data-wide]]:max-w-none"
        >
          {children}
        </main>
      </div>
    </>
  );
}

async function SignedInAs() {
  const { user } = await requireSession();
  return <p className="truncate">{user.email}</p>;
}
