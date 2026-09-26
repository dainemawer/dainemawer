import type { ReactNode } from "react";
import { NavLink } from "@/components/nav-link";
import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentUserContext } from "@/lib/data/current-user";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { email } = await getCurrentUserContext();

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-surface md:grid-cols-shell">
      <aside className="flex flex-col gap-8 border-divider border-b px-6 py-8 md:border-r md:border-b-0">
        <strong className="text-ink">D-M</strong>
        <nav className="flex flex-col gap-3 text-sm">
          <NavLink href="/dashboard">Overview</NavLink>
          <NavLink href="/dashboard/change-requests">Change requests</NavLink>
          <NavLink href="/dashboard/bug-reports">Bug reports</NavLink>
          <NavLink href="/dashboard/timeline">Timeline</NavLink>
        </nav>
        <div className="mt-auto text-xs text-faint">
          <p className="m-0 mb-2">{email}</p>
          <SignOutButton />
        </div>
      </aside>
      <main className="p-8 md:p-12">{children}</main>
    </div>
  );
}
