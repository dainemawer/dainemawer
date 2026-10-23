import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { LogoMark } from "@/components/logo-mark";
import { SignOutButton } from "@/components/sign-out-button";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { user } = await requireSession();
  return (
    <div className="mx-auto grid min-h-svh max-w-shell md:grid-cols-shell">
      <aside className="flex flex-col gap-8 border-b px-4 py-5 md:sticky md:top-0 md:h-svh md:border-r md:border-b-0 md:px-6 md:py-8">
        <Link
          href="/"
          aria-label="Dashboard"
          className="block text-ink transition-opacity hover:opacity-60"
        >
          <LogoMark />
          <span className="mt-1 block text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            Admin
          </span>
        </Link>
        <AppNav />
        <div className="mt-auto hidden text-xs text-muted-foreground md:block">
          <p className="truncate">{user.email}</p>
          <SignOutButton />
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 md:px-10 md:py-8">{children}</main>
    </div>
  );
}
